import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import {
  sendBookingAdminNotificationEmail,
  sendBookingReceivedEmail,
} from "@/lib/email/booking-emails";
import {
  bookingPricing,
  selectableExtraServices,
  type DogSize,
} from "@/lib/listino-config";
import { calculateBookingEstimate } from "@/lib/pricing";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assignBoxTypeForRange } from "@/lib/box-availability";
import { normalizeOptionalBoxType } from "@/lib/box-types";

type DogPayload = {
  name?: unknown;
  breed?: unknown;
  size?: unknown;
  age?: unknown;
  sex?: unknown;
  sterilized?: unknown;
};

type ManualBookingBody = {
  source?: unknown;
  status?: unknown;

  startDate?: unknown;
  endDate?: unknown;

  ownerName?: unknown;
  ownerSurname?: unknown;
  email?: unknown;
  phone?: unknown;
  expectedArrivalTime?: unknown;
  expectedPickupTime?: unknown;
  boxType?: unknown;

  dogs?: unknown;
  extraServiceIds?: unknown;

  dogName?: unknown;
  dogBreed?: unknown;
  dogSize?: unknown;
  dogAge?: unknown;
  dogSex?: unknown;
  dogSterilized?: unknown;

  notes?: unknown;
  adminNotes?: unknown;
};

type NormalizedDog = {
  name: string;
  breed: string | null;
  size: DogSize;
  age: number | null;
  sex: "male" | "female" | "unknown";
  sterilized: boolean | null;
};

type BookingDogRow = {
  id: string;
  name: string;
  breed: string | null;
  size: string;
  age: number | null;
  sex: string | null;
  sterilized: boolean | null;
};

type BookingDogLinkRow = {
  booking_id: string;
  dog_id: string;
  position: number;
};

type AdminProfile = {
  email: string | null;
};

type AdminBookingApiRow = Record<string, unknown> & {
  id: string;
  box_count: unknown;
  estimated_price_cents: unknown;
  selected_extra_services: unknown;
  booking_dogs: Array<{
    position: number;
    dog: BookingDogRow | null;
  }>;
};

const adminBookingsSelect = `
  id,
  source,
  status,
  stay_type,
  start_date,
  end_date,
  expected_arrival_time,
  expected_pickup_time,
  box_type,
  notes,
  admin_notes,
  created_at,
  updated_at,
  confirmed_at,
  rejected_at,
  cancelled_at,
  box_count,
  estimated_price_cents,
  estimated_price_details,
  selected_extra_services,
  customer:customers (
    id,
    first_name,
    last_name,
    email,
    phone
  ),
  dog:dogs!bookings_dog_id_fkey (
    id,
    name,
    breed,
    size,
    age,
    sex,
    sterilized
  )
`;

const legacyAdminBookingsSelect = `
  id,
  source,
  status,
  stay_type,
  start_date,
  end_date,
  notes,
  admin_notes,
  created_at,
  updated_at,
  confirmed_at,
  rejected_at,
  cancelled_at,
  customer:customers (
    id,
    first_name,
    last_name,
    email,
    phone
  ),
  dog:dogs!bookings_dog_id_fkey (
    id,
    name,
    breed,
    size,
    age,
    sex,
    sterilized
  )
`;

const allowedDogSizes: DogSize[] = ["small", "medium", "large", "giant"];

function isValidDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
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

function normalizeRequiredDbString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeEmailForDb(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function hasEmail(value: unknown) {
  return normalizeEmailForDb(value).length > 0;
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

function normalizeDogs(body: ManualBookingBody) {
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
    if (!isNonEmptyString(rawDog.name)) {
      return {
        ok: false,
        dogs: [],
        error: "Inserisci il nome di ogni cane.",
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

  const allowedIds = new Set(
    selectableExtraServices.map((service) => service.id),
  );

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

export async function GET() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const primaryResponse = await supabaseAdmin
    .from("bookings")
    .select(adminBookingsSelect)
    .order("created_at", { ascending: false });

  let data = primaryResponse.data as Array<Record<string, unknown>> | null;
  let error = primaryResponse.error;
  let usedLegacySelect = false;

  if (error) {
    console.error("Admin bookings primary fetch error:", error);

    const fallbackResponse = await supabaseAdmin
      .from("bookings")
      .select(legacyAdminBookingsSelect)
      .order("created_at", { ascending: false });

    data = fallbackResponse.data as Array<Record<string, unknown>> | null;
    error = fallbackResponse.error;
    usedLegacySelect = true;
  }

  if (error) {
    console.error("Admin bookings fetch error:", error);

    return NextResponse.json(
      { error: "Errore durante il caricamento delle prenotazioni." },
      { status: 500 },
    );
  }

  const bookings = (data ?? []).map((booking) => ({
    ...booking,
    id: String(booking.id),
  expected_arrival_time:
      "expected_arrival_time" in booking ? booking.expected_arrival_time : null,
    expected_pickup_time:
      "expected_pickup_time" in booking ? booking.expected_pickup_time : null,
    box_type: "box_type" in booking ? booking.box_type : null,
    box_count: "box_count" in booking ? booking.box_count : null,
    estimated_price_cents:
      "estimated_price_cents" in booking ? booking.estimated_price_cents : null,
    selected_extra_services:
      "selected_extra_services" in booking
        ? booking.selected_extra_services
        : [],
    booking_dogs: [],
  })) as AdminBookingApiRow[];

  if (usedLegacySelect) {
    return NextResponse.json({
      bookings,
    });
  }

  const bookingIds = bookings.map((booking) => booking.id);

  if (bookingIds.length === 0) {
    return NextResponse.json({
      bookings: [],
    });
  }

  const { data: bookingDogLinks, error: bookingDogLinksError } =
    await supabaseAdmin
      .from("booking_dogs")
      .select("booking_id, dog_id, position")
      .in("booking_id", bookingIds);

  if (bookingDogLinksError) {
    console.error("Admin booking dogs links fetch error:", bookingDogLinksError);

    return NextResponse.json({
      bookings: bookings.map((booking) => ({
        ...booking,
        booking_dogs: [],
      })),
    });
  }

  const links = (bookingDogLinks ?? []) as BookingDogLinkRow[];
  const dogIds = Array.from(new Set(links.map((link) => link.dog_id)));

  const dogsById = new Map<string, BookingDogRow>();

  if (dogIds.length > 0) {
    const { data: linkedDogs, error: linkedDogsError } = await supabaseAdmin
      .from("dogs")
      .select("id, name, breed, size, age, sex, sterilized")
      .in("id", dogIds);

    if (linkedDogsError) {
      console.error("Admin booking linked dogs fetch error:", linkedDogsError);
    } else {
      ((linkedDogs ?? []) as BookingDogRow[]).forEach((dog) => {
        dogsById.set(dog.id, dog);
      });
    }
  }

  const linksByBookingId = new Map<string, BookingDogLinkRow[]>();

  links.forEach((link) => {
    const current = linksByBookingId.get(link.booking_id) ?? [];
    current.push(link);
    linksByBookingId.set(link.booking_id, current);
  });

  return NextResponse.json({
    bookings: bookings.map((booking) => ({
      ...booking,
      booking_dogs: (linksByBookingId.get(booking.id) ?? [])
        .sort((a, b) => a.position - b.position)
        .map((link) => ({
          position: link.position,
          dog: dogsById.get(link.dog_id) ?? null,
        })),
    })),
  });
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  let body: ManualBookingBody;

  try {
    body = (await request.json()) as ManualBookingBody;
  } catch {
    return NextResponse.json(
      { error: "Body JSON non valido." },
      { status: 400 },
    );
  }

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

  if (!isNonEmptyString(body.ownerName) || !isNonEmptyString(body.ownerSurname)) {
    return NextResponse.json(
      {
        error: "Compila i campi obbligatori: nome e cognome.",
      },
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
  const source =
    body.source === "phone" || body.source === "admin" ? body.source : "admin";
  const status =
    body.status === "pending" || body.status === "confirmed"
      ? body.status
      : "confirmed";
  const extraServiceIds = normalizeExtraServiceIds(body.extraServiceIds);
  const expectedArrivalTime = normalizeOptionalTime(body.expectedArrivalTime);
  const expectedPickupTime = normalizeOptionalTime(body.expectedPickupTime);
  const requestedBoxType = normalizeOptionalBoxType(body.boxType);
  const ownerName = String(body.ownerName).trim();
  const ownerSurname = String(body.ownerSurname).trim();
  const ownerEmail = normalizeEmailForDb(body.email);
  const ownerPhone = normalizeRequiredDbString(body.phone);
  const notes = normalizeOptionalString(body.notes);
  const stayType = getStayType(startDate, endDate);

  if (!expectedPickupTime) {
    return NextResponse.json(
      { error: "Inserisci l'orario previsto di ritiro." },
      { status: 400 },
    );
  }

  if (
    typeof body.boxType === "string" &&
    body.boxType.trim() !== "" &&
    !requestedBoxType
  ) {
    return NextResponse.json(
      { error: "Tipologia box non valida." },
      { status: 400 },
    );
  }

  const estimate = calculateBookingEstimate({
    startDate,
    endDate,
    dogs,
    extraServiceIds,
    expectedPickupTime,
  });

  let assignedBoxType = requestedBoxType;

  if (status === "confirmed") {
    const availabilityCheck = await assignBoxTypeForRange({
      startDate,
      endDate,
      requiredBoxes,
      requestedBoxType,
    });

    if (!availabilityCheck.ok) {
      return NextResponse.json(
        { error: availabilityCheck.error },
        { status: availabilityCheck.status },
      );
    }

    assignedBoxType = availabilityCheck.boxType;
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
    console.error("Manual booking customer insert error:", customerError);

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
    console.error("Manual booking dogs insert error:", dogError);

    return NextResponse.json(
      { error: "Errore durante il salvataggio dei cani." },
      { status: 500 },
    );
  }

  const now = new Date().toISOString();
  const primaryDog = insertedDogs[0];

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("bookings")
    .insert({
      customer_id: customer.id,
      dog_id: primaryDog.id,
      source,
      status,
      stay_type: stayType,
      start_date: startDate,
      end_date: endDate,
      expected_arrival_time: expectedArrivalTime,
      expected_pickup_time: expectedPickupTime,
      notes,
      admin_notes: normalizeOptionalString(body.adminNotes),
      confirmed_at: status === "confirmed" ? now : null,
      box_count: requiredBoxes,
      box_type: assignedBoxType,
      estimated_price_cents: estimate.isComplete ? estimate.totalCents : null,
      estimated_price_details: estimate,
      selected_extra_services: estimate.selectedExtras,
      updated_at: now,
    })
    .select("id, created_at")
    .single();

  if (bookingError || !booking) {
    console.error("Manual booking insert error:", bookingError);

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
    console.error("Manual booking dogs link error:", bookingDogsError);

    return NextResponse.json(
      { error: "Errore durante il collegamento dei cani alla prenotazione." },
      { status: 500 },
    );
  }

  if (hasEmail(body.email)) {
    await sendBookingReceivedEmail({
      to: ownerEmail,
      ownerName,
      dogName: dogs.map((dog) => dog.name).join(", "),
      startDate,
      endDate,
    }).catch((emailError) => {
      console.error("Manual booking received email error:", emailError);
    });
  }

  const dogNames = dogs.map((dog) => dog.name).join(", ");
  const firstDog = dogs[0];
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
        source,
        submittedFromAdmin: true,
        status,
        notes,
      }).catch((emailError) => {
        console.error("Manual booking admin notification email error:", {
          recipient: to,
          error: emailError,
        });
      }),
    ),
  );

  return NextResponse.json(
    {
      bookingId: booking.id,
      message: "Prenotazione manuale inserita correttamente.",
    },
    { status: 201 },
  );
}
