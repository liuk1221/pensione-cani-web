import { NextRequest, NextResponse } from "next/server";
import {
  sendBookingAdminNotificationEmail,
  sendBookingReceivedEmail,
} from "@/lib/email/booking-emails";
import { supabaseAdmin } from "@/lib/supabase/admin";

type PublicBookingBody = {
  startDate?: unknown;
  endDate?: unknown;

  ownerName?: unknown;
  ownerSurname?: unknown;
  email?: unknown;
  phone?: unknown;

  dogName?: unknown;
  dogBreed?: unknown;
  dogSize?: unknown;
  dogAge?: unknown;
  dogSex?: unknown;
  dogSterilized?: unknown;

  notes?: unknown;
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

function isValidDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
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

  return rows.filter((row) => row.day >= startDate && row.day < endDate);
}

async function checkAvailability(startDate: string, endDate: string) {
  const { data, error } = await supabaseAdmin.rpc("get_public_availability", {
    from_date: startDate,
    to_date: endDate,
  });

  if (error) {
    console.error("Public booking availability check error:", error);

    return {
      ok: false,
      error: "Errore durante la verifica della disponibilità.",
      status: 500,
    };
  }

  const rows = (data ?? []) as AvailabilityRow[];
  const occupiedDays = getOccupiedDays(rows, startDate, endDate);

  const unavailableDay = occupiedDays.find(
    (day) => day.status === "closed" || day.available_boxes <= 0,
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
  let body: PublicBookingBody;

  try {
    body = (await request.json()) as PublicBookingBody;
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
      { error: "La data di uscita non può essere precedente all’arrivo." },
      { status: 400 },
    );
  }

  if (
    !isNonEmptyString(body.ownerName) ||
    !isNonEmptyString(body.ownerSurname) ||
    !isNonEmptyString(body.email) ||
    !isNonEmptyString(body.phone) ||
    !isNonEmptyString(body.dogName) ||
    !isNonEmptyString(body.dogSize)
  ) {
    return NextResponse.json(
      { error: "Compila tutti i campi obbligatori." },
      { status: 400 },
    );
  }

  if (!isValidPhoneNumber(body.phone)) {
    return NextResponse.json(
      { error: "Inserisci un numero di telefono valido." },
      { status: 400 },
    );
  }

  const dogSize = String(body.dogSize);

  if (!["small", "medium", "large", "giant"].includes(dogSize)) {
    return NextResponse.json(
      { error: "Taglia cane non valida." },
      { status: 400 },
    );
  }

  const dogSex =
    body.dogSex === "male" || body.dogSex === "female"
      ? body.dogSex
      : "unknown";
  const dogAge = parseDogAge(body.dogAge);
  const dogSterilized = parseSterilized(body.dogSterilized);
  const ownerName = String(body.ownerName).trim();
  const ownerSurname = String(body.ownerSurname).trim();
  const ownerEmail = String(body.email).trim().toLowerCase();
  const ownerPhone = normalizePhone(body.phone);
  const dogName = String(body.dogName).trim();
  const dogBreed = normalizeOptionalString(body.dogBreed);
  const notes = normalizeOptionalString(body.notes);
  const stayType = getStayType(startDate, endDate);

  const availabilityCheck = await checkAvailability(startDate, endDate);

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

  const { data: dog, error: dogError } = await supabaseAdmin
    .from("dogs")
    .insert({
      customer_id: customer.id,
      name: dogName,
      breed: dogBreed,
      size: dogSize,
      age: dogAge,
      sex: dogSex,
      sterilized: dogSterilized,
    })
    .select("id")
    .single();

  if (dogError || !dog) {
    console.error("Public booking dog insert error:", dogError);

    return NextResponse.json(
      { error: "Errore durante il salvataggio del cane." },
      { status: 500 },
    );
  }

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("bookings")
    .insert({
      customer_id: customer.id,
      dog_id: dog.id,
      source: "online",
      status: "pending",
      stay_type: stayType,
      start_date: startDate,
      end_date: endDate,
      notes,
      admin_notes: null,
      confirmed_at: null,
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

  await sendBookingReceivedEmail({
    to: ownerEmail,
    ownerName,
    dogName,
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
        dogName,
        dogBreed,
        dogSize,
        dogAge,
        dogSex,
        dogSterilized,
        startDate,
        endDate,
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
