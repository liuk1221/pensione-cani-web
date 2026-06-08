import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type BookingRequestBody = {
  startDate: string;
  endDate: string;
  stayLabel: string;

  ownerName: string;
  ownerSurname: string;
  email: string;
  phone: string;

  dogName: string;
  dogBreed?: string;
  dogSize: "small" | "medium" | "large" | "giant";
  dogAge?: string;
  dogSex?: "male" | "female" | "";
  dogSterilized?: "yes" | "no" | "unknown" | "";

  notes?: string;
};

type AvailabilityRow = {
  day: string;
  total_boxes: number;
  occupied_boxes: number;
  blocked_boxes: number;
  available_boxes: number;
  status: "available" | "limited" | "full" | "closed";
};

function isValidDateKey(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
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

function getOccupiedDays(rows: AvailabilityRow[], startDate: string, endDate: string) {
  const stayType = getStayType(startDate, endDate);

  if (stayType === "day_care") {
    return rows.filter((row) => row.day === startDate);
  }

  return rows.filter((row) => row.day >= startDate && row.day < endDate);
}

export async function POST(request: NextRequest) {
  let body: BookingRequestBody;

  try {
    body = (await request.json()) as BookingRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Body JSON non valido." },
      { status: 400 },
    );
  }

  if (!isValidDateKey(body.startDate) || !isValidDateKey(body.endDate)) {
    return NextResponse.json(
      { error: "Date non valide." },
      { status: 400 },
    );
  }

  if (body.startDate < getTodayKey()) {
    return NextResponse.json(
      { error: "Non puoi prenotare una data passata." },
      { status: 400 },
    );
  }

  if (body.endDate < body.startDate) {
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

  const stayType = getStayType(body.startDate, body.endDate);

  const { data: availabilityData, error: availabilityError } =
    await supabaseAdmin.rpc("get_public_availability", {
      from_date: body.startDate,
      to_date: body.endDate,
    });

  if (availabilityError) {
    console.error("Availability check error:", availabilityError);

    return NextResponse.json(
      { error: "Errore durante la verifica della disponibilità." },
      { status: 500 },
    );
  }

  const occupiedDays = getOccupiedDays(
    (availabilityData ?? []) as AvailabilityRow[],
    body.startDate,
    body.endDate,
  );

  const unavailableDay = occupiedDays.find(
    (day) => day.status === "closed" || day.available_boxes <= 0,
  );

  if (unavailableDay) {
    return NextResponse.json(
      {
        error: `La data ${unavailableDay.day} non è più disponibile. Aggiorna il calendario e scegli un altro intervallo.`,
      },
      { status: 409 },
    );
  }

  const { data: customer, error: customerError } = await supabaseAdmin
    .from("customers")
    .insert({
      first_name: body.ownerName.trim(),
      last_name: body.ownerSurname.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
    })
    .select("id")
    .single();

  if (customerError || !customer) {
    console.error("Customer insert error:", customerError);

    return NextResponse.json(
      { error: "Errore durante il salvataggio del proprietario." },
      { status: 500 },
    );
  }

  const { data: dog, error: dogError } = await supabaseAdmin
    .from("dogs")
    .insert({
      customer_id: customer.id,
      name: body.dogName.trim(),
      breed: normalizeOptionalString(body.dogBreed),
      size: body.dogSize,
      age: parseDogAge(body.dogAge),
      sex: body.dogSex || "unknown",
      sterilized: parseSterilized(body.dogSterilized),
    })
    .select("id")
    .single();

  if (dogError || !dog) {
    console.error("Dog insert error:", dogError);

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
      start_date: body.startDate,
      end_date: body.endDate,
      notes: normalizeOptionalString(body.notes),
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    console.error("Booking insert error:", bookingError);

    return NextResponse.json(
      { error: "Errore durante il salvataggio della prenotazione." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      bookingId: booking.id,
      message: "Richiesta di prenotazione salvata correttamente.",
    },
    { status: 201 },
  );
}