import { NextRequest, NextResponse } from "next/server";
import {
  sendBookingAdminNotificationEmail,
  sendBookingReceivedEmail,
} from "@/lib/email/booking-emails";
import {
  bookingPricing,
  extraServices,
  type DogSize,
} from "@/lib/listino-config";
import { calculateBookingEstimate } from "@/lib/pricing";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  applyRateLimit,
  forbiddenOriginResponse,
  getClientIp,
  isSameOriginRequest,
  rateLimitResponse,
  readJsonBody,
} from "@/lib/request-security";

type DogPayload = {
  name?: unknown;
  breed?: unknown;
  size?: unknown;
  age?: unknown;
  sex?: unknown;
  sterilized?: unknown;
};

type PublicBookingBody = {
  startDate?: unknown;
  endDate?: unknown;

  ownerName?: unknown;
  ownerSurname?: unknown;
  email?: unknown;
  phone?: unknown;
  expectedArrivalTime?: unknown;
  expectedPickupTime?: unknown;

  dogs?: unknown;
  extraServiceIds?: unknown;

  dogName?: unknown;
  dogBreed?: unknown;
  dogSize?: unknown;
  dogAge?: unknown;
  dogSex?: unknown;
  dogSterilized?: unknown;

  notes?: unknown;
};

type NormalizedDog = {
  name: string;
  breed: string | null;
  size: DogSize;
  age: number | null;
  sex: "male" | "female" | "unknown";
  sterilized: boolean | null;
};

type AvailabilityRow = {
  day: string;
  total_boxes: number;
  occupied_boxes: number;
  blocked_boxes: number;
  available_boxes: number;
  status: "available" | "limited" | "full" | "closed";
};

type AdminProfile = {
  email: string | null;
};

const allowedDogSizes: DogSize[] = ["small", "medium", "large", "giant"];
//Limiti server-side per contenere payload e dati persistiti.
const fieldLimits = {
  name: 100,
  email: 254,
  phone: 30,
  dogName: 100,
  breed: 100,
  notes: 2_000,
};

function isValidDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringWithinLimit(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length <= maxLength;
}

function isValidEmail(value: unknown) {
  if (typeof value !== "string" || value.length > fieldLimits.email) return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizePhone(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isValidPhoneNumber(value: unknown) {
  const phone = normalizePhone(value);
  const digits = phone.replace(/\D/g, "");

  return (
    digits.length >= 7 &&
    digits.length <= 15 &&
    /^\+?[0-9\s().-]+$/.test(phone)
  );
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalTime(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const trimmed = value.trim();

  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : null;
}

function parseDogAge(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parseSterilized(value: unknown) {
  if (value === "yes") {
    return true;
  }

  if (value === "no") {
    return false;
  }

  return null;
}

function parseDogSex(value: unknown) {
  return value === "male" || value === "female" ? value : "unknown";
}

function parseDogSize(value: unknown): DogSize | null {
  return typeof value === "string" && allowedDogSizes.includes(value as DogSize)
    ? (value as DogSize)
    : null;
}

function getStayType(startDate: string, endDate: string) {
  return startDate === endDate ? "day_care" : "overnight";
}

function getOccupiedDays(
  rows: AvailabilityRow[],
  startDate: string,
  endDate: string,
) {
  if (startDate === endDate) {
    return rows.filter((row) => row.day === startDate);
  }

  return rows.filter((row) => row.day >= startDate && row.day <= endDate);
}

function normalizeDogs(body: PublicBookingBody) {
  const rawDogs = Array.isArray(body.dogs)
    ? (body.dogs as DogPayload[])
    : [
        {
          name: body.dogName,
          breed: body.dogBreed,
          size: body.dogSize,
          age: body.dogAge,
          sex: body.dogSex,
          sterilized: body.dogSterilized,
        },
      ];

  if (
    rawDogs.length === 0 ||
    rawDogs.length > bookingPricing.maxDogsPerBooking
  ) {
    return {
      ok: false,
      dogs: [],
      error: `Puoi inserire da 1 a ${bookingPricing.maxDogsPerBooking} cani per prenotazione.`,
    };
  }

  const dogs: NormalizedDog[] = [];

  for (const rawDog of rawDogs) {
    if (
      !isNonEmptyString(rawDog.name) ||
      !isStringWithinLimit(rawDog.name, fieldLimits.dogName) ||
      !isStringWithinLimit(rawDog.breed ?? "", fieldLimits.breed)
    ) {
      return {
        ok: false,
        dogs: [],
        error: "I dati del cane sono mancanti o troppo lunghi.",
      };
    }

    const size = parseDogSize(rawDog.size);

    if (!size) {
      return {
        ok: false,
        dogs: [],
        error: "Taglia cane non valida.",
      };
    }

    dogs.push({
      name: String(rawDog.name).trim(),
      breed: normalizeOptionalString(rawDog.breed),
      size,
      age: parseDogAge(rawDog.age),
      sex: parseDogSex(rawDog.sex),
      sterilized: parseSterilized(rawDog.sterilized),
    });
  }

  return {
    ok: true,
    dogs,
    error: null,
  };
}

function normalizeExtraServiceIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowedIds = new Set(extraServices.map((service) => service.id));

  return Array.from(
    new Set(
      value.filter(
        (item): item is string =>
          typeof item === "string" && allowedIds.has(item),
      ),
    ),
  );
}

function getRequiredBoxes(dogCount: number) {
  return dogCount > 0 ? 1 : 0;
}

async function checkAvailability(
  startDate: string,
  endDate: string,
  requiredBoxes: number,
) {
  const { data, error } = await supabaseAdmin.rpc("get_public_availability", {
    from_date: startDate,
    to_date: endDate,
  });

  if (error) {
    console.error("Public booking availability check error:", error);

    return {
      ok: false,
      error: "Errore durante la verifica della disponibilita.",
      status: 500,
    };
  }

  const rows = (data ?? []) as AvailabilityRow[];
  const occupiedDays = getOccupiedDays(rows, startDate, endDate);

  const unavailableDay = occupiedDays.find(
    (day) =>
      day.status === "closed" || day.available_boxes < requiredBoxes,
  );

  if (unavailableDay) {
    return {
      ok: false,
      error: `La data ${unavailableDay.day} non ha slot disponibili.`,
      status: 409,
    };
  }

  return {
    ok: true,
    error: null,
    status: 200,
  };
}

async function getAdminNotificationRecipients() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("role", "admin");

  if (error) {
    console.error("Admin notification recipients fetch error:", error);

    return [];
  }

  const emails = ((data ?? []) as AdminProfile[])
    .map((profile) => profile.email?.trim().toLowerCase() ?? "")
    .filter(Boolean);

  return Array.from(new Set(emails));
}

export async function POST(request: NextRequest) {
  //Blocca invii cross-site del form pubblico.
  if (!isSameOriginRequest(request)) return forbiddenOriginResponse();

  const ip = getClientIp(request);
  //Il doppio limite contiene sia raffiche brevi sia abuso continuativo.
  const shortLimit = applyRateLimit({
    key: `public-booking:15m:${ip}`,
    limit: 5,
    windowMs: 15 * 60 * 1_000,
  });

  if (!shortLimit.allowed) return rateLimitResponse(shortLimit.resetAt);

  const dailyLimit = applyRateLimit({
    key: `public-booking:day:${ip}`,
    limit: 20,
    windowMs: 24 * 60 * 60 * 1_000,
  });

  if (!dailyLimit.allowed) return rateLimitResponse(dailyLimit.resetAt);

  //Legge solo JSON entro 16 KiB prima di elaborare la prenotazione.
  const parsedBody = await readJsonBody<PublicBookingBody>(request, 16_384);

  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.error },
      { status: parsedBody.status },
    );
  }

  const body = parsedBody.value;

  if (!isValidDateKey(body.startDate) || !isValidDateKey(body.endDate)) {
    return NextResponse.json({ error: "Date non valide." }, { status: 400 });
  }

  const startDate = body.startDate;
  const endDate = body.endDate;

  if (endDate < startDate) {
    return NextResponse.json(
      { error: "La data di uscita non puo essere precedente all'arrivo." },
      { status: 400 },
    );
  }

  if (
    !isNonEmptyString(body.ownerName) ||
    !isNonEmptyString(body.ownerSurname) ||
    !isNonEmptyString(body.phone) ||
    !isStringWithinLimit(body.ownerName, fieldLimits.name) ||
    !isStringWithinLimit(body.ownerSurname, fieldLimits.name) ||
    !isStringWithinLimit(body.phone, fieldLimits.phone) ||
    !isStringWithinLimit(body.notes ?? "", fieldLimits.notes)
  ) {
    return NextResponse.json(
      { error: "Compila tutti i campi obbligatori." },
      { status: 400 },
    );
  }

  //Evita prenotazioni con intervalli irrealistici o date non interpretabili.
  const stayDays =
    (Date.parse(`${endDate}T00:00:00Z`) -
      Date.parse(`${startDate}T00:00:00Z`)) /
    86_400_000;

  if (!Number.isFinite(stayDays) || stayDays > 370) {
    return NextResponse.json(
      { error: "Intervallo di prenotazione non valido o troppo ampio." },
      { status: 400 },
    );
  }

  if (!isValidEmail(body.email)) {
    return NextResponse.json(
      { error: "Inserisci un indirizzo email valido." },
      { status: 400 },
    );
  }

  if (!isValidPhoneNumber(body.phone)) {
    return NextResponse.json(
      { error: "Inserisci un numero di telefono valido." },
      { status: 400 },
    );
  }

  const normalizedDogs = normalizeDogs(body);

  if (!normalizedDogs.ok) {
    return NextResponse.json(
      { error: normalizedDogs.error },
      { status: 400 },
    );
  }

  const dogs = normalizedDogs.dogs;
  const requiredBoxes = getRequiredBoxes(dogs.length);
  const extraServiceIds = normalizeExtraServiceIds(body.extraServiceIds);
  const estimate = calculateBookingEstimate({
    startDate,
    endDate,
    dogs,
    extraServiceIds,
  });
  const ownerName = String(body.ownerName).trim();
  const ownerSurname = String(body.ownerSurname).trim();
  const ownerEmail = String(body.email).trim().toLowerCase();
  const ownerPhone = normalizePhone(body.phone);
  const expectedArrivalTime = normalizeOptionalTime(body.expectedArrivalTime);
  const expectedPickupTime = normalizeOptionalTime(body.expectedPickupTime);
  const notes = normalizeOptionalString(body.notes);
  const stayType = getStayType(startDate, endDate);

  const availabilityCheck = await checkAvailability(
    startDate,
    endDate,
    requiredBoxes,
  );

  if (!availabilityCheck.ok) {
    return NextResponse.json(
      { error: availabilityCheck.error },
      { status: availabilityCheck.status },
    );
  }

  const { data: customer, error: customerError } = await supabaseAdmin
    .from("customers")
    .insert({
      first_name: ownerName,
      last_name: ownerSurname,
      email: ownerEmail,
      phone: ownerPhone,
    })
    .select("id")
    .single();

  if (customerError || !customer) {
    console.error("Public booking customer insert error:", customerError);

    return NextResponse.json(
      { error: "Errore durante il salvataggio del proprietario." },
      { status: 500 },
    );
  }

  const { data: insertedDogs, error: dogError } = await supabaseAdmin
    .from("dogs")
    .insert(
      dogs.map((dog) => ({
        customer_id: customer.id,
        name: dog.name,
        breed: dog.breed,
        size: dog.size,
        age: dog.age,
        sex: dog.sex,
        sterilized: dog.sterilized,
      })),
    )
    .select("id");

  if (dogError || !insertedDogs || insertedDogs.length !== dogs.length) {
    console.error("Public booking dogs insert error:", dogError);

    return NextResponse.json(
      { error: "Errore durante il salvataggio dei cani." },
      { status: 500 },
    );
  }

  const primaryDog = insertedDogs[0];
  const now = new Date().toISOString();

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("bookings")
    .insert({
      customer_id: customer.id,
      dog_id: primaryDog.id,
      source: "online",
      status: "pending",
      stay_type: stayType,
      start_date: startDate,
      end_date: endDate,
      expected_arrival_time: expectedArrivalTime,
      expected_pickup_time: expectedPickupTime,
      notes,
      admin_notes: null,
      confirmed_at: null,
      box_count: requiredBoxes,
      estimated_price_cents: estimate.isComplete ? estimate.totalCents : null,
      estimated_price_details: estimate,
      selected_extra_services: estimate.selectedExtras,
      updated_at: now,
    })
    .select("id, created_at")
    .single();

  if (bookingError || !booking) {
    console.error("Public booking insert error:", bookingError);

    return NextResponse.json(
      { error: "Errore durante il salvataggio della prenotazione." },
      { status: 500 },
    );
  }

  const { error: bookingDogsError } = await supabaseAdmin
    .from("booking_dogs")
    .insert(
      insertedDogs.map((dog, index) => ({
        booking_id: booking.id,
        dog_id: dog.id,
        position: index + 1,
      })),
    );

  if (bookingDogsError) {
    console.error("Public booking dogs link error:", bookingDogsError);

    return NextResponse.json(
      { error: "Errore durante il collegamento dei cani alla prenotazione." },
      { status: 500 },
    );
  }

  const dogNames = dogs.map((dog) => dog.name).join(", ");
  const firstDog = dogs[0];

  await sendBookingReceivedEmail({
    to: ownerEmail,
    ownerName,
    dogName: dogNames,
    startDate,
    endDate,
  }).catch((error) => {
    console.error("Public booking received email error:", error);
  });

  const adminRecipients = await getAdminNotificationRecipients();

  await Promise.all(
    adminRecipients.map((to) =>
      sendBookingAdminNotificationEmail({
        to,
        bookingId: booking.id,
        receivedAt: booking.created_at ?? null,
        ownerName,
        ownerSurname,
        ownerEmail,
        ownerPhone,
        dogName: dogNames,
        dogBreed: firstDog.breed,
        dogSize: firstDog.size,
        dogAge: firstDog.age,
        dogSex: firstDog.sex,
        dogSterilized: firstDog.sterilized,
        dogs: dogs.map((dog) => ({
          name: dog.name,
          breed: dog.breed,
          size: dog.size,
          age: dog.age,
          sex: dog.sex,
          sterilized: dog.sterilized,
        })),
        startDate,
        endDate,
        expectedArrivalTime,
        expectedPickupTime,
        stayType,
        source: "online",
        status: "pending",
        notes,
      }).catch((error) => {
        console.error("Public booking admin notification email error:", {
          recipient: to,
          error,
        });
      }),
    ),
  );

  return NextResponse.json(
    {
      bookingId: booking.id,
      message: "Richiesta di prenotazione ricevuta correttamente.",
    },
    { status: 201 },
  );
}
