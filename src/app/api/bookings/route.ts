import { NextRequest, NextResponse } from "next/server";
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
      first_name: String(body.ownerName).trim(),
      last_name: String(body.ownerSurname).trim(),
      email: String(body.email).trim().toLowerCase(),
      phone: String(body.phone).trim(),
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
      name: String(body.dogName).trim(),
      breed: normalizeOptionalString(body.dogBreed),
      size: dogSize,
      age: parseDogAge(body.dogAge),
      sex: dogSex,
      sterilized: parseSterilized(body.dogSterilized),
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
      stay_type: getStayType(startDate, endDate),
      start_date: startDate,
      end_date: endDate,
      notes: normalizeOptionalString(body.notes),
      admin_notes: null,
      confirmed_at: null,
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    console.error("Public booking insert error:", bookingError);

    return NextResponse.json(
      { error: "Errore durante il salvataggio della prenotazione." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      bookingId: booking.id,
      message: "Richiesta di prenotazione ricevuta correttamente.",
    },
    { status: 201 },
  );
}
