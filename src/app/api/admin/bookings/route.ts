import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ManualBookingBody = {
  source?: unknown;
  status?: unknown;

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
  adminNotes?: unknown;
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
    console.error("Manual booking availability check error:", error);

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
      error: `Impossibile inserire la prenotazione confermata: la data ${unavailableDay.day} non ha slot disponibili.`,
      status: 409,
    };
  }

  return {
    ok: true,
    error: null,
    status: 200,
  };
}

export async function GET() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(
      `
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
      dog:dogs (
        id,
        name,
        breed,
        size,
        age,
        sex,
        sterilized
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin bookings fetch error:", error);

    return NextResponse.json(
      { error: "Errore durante il caricamento delle prenotazioni." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    bookings: data ?? [],
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
      { error: "La data di uscita non può essere precedente all’arrivo." },
      { status: 400 },
    );
  }

  if (
    !isNonEmptyString(body.ownerName) ||
    !isNonEmptyString(body.ownerSurname) ||
    !isNonEmptyString(body.dogName) ||
    !isNonEmptyString(body.dogSize)
  ) {
    return NextResponse.json(
      {
        error:
          "Compila i campi obbligatori: nome, cognome, nome cane e taglia.",
      },
      { status: 400 },
    );
  }

  const source =
    body.source === "phone" || body.source === "admin" ? body.source : "admin";

  const status =
    body.status === "pending" || body.status === "confirmed"
      ? body.status
      : "confirmed";

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

  if (status === "confirmed") {
    const availabilityCheck = await checkAvailability(startDate, endDate);

    if (!availabilityCheck.ok) {
      return NextResponse.json(
        { error: availabilityCheck.error },
        { status: availabilityCheck.status },
      );
    }
  }

  const { data: customer, error: customerError } = await supabaseAdmin
    .from("customers")
    .insert({
      first_name: String(body.ownerName).trim(),
      last_name: String(body.ownerSurname).trim(),
      email: normalizeEmailForDb(body.email),
      phone: normalizeRequiredDbString(body.phone),
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
    console.error("Manual booking dog insert error:", dogError);

    return NextResponse.json(
      { error: "Errore durante il salvataggio del cane." },
      { status: 500 },
    );
  }

  const now = new Date().toISOString();

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("bookings")
    .insert({
      customer_id: customer.id,
      dog_id: dog.id,
      source,
      status,
      stay_type: getStayType(startDate, endDate),
      start_date: startDate,
      end_date: endDate,
      notes: normalizeOptionalString(body.notes),
      admin_notes: normalizeOptionalString(body.adminNotes),
      confirmed_at: status === "confirmed" ? now : null,
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    console.error("Manual booking insert error:", bookingError);

    return NextResponse.json(
      { error: "Errore durante il salvataggio della prenotazione." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      bookingId: booking.id,
      message: "Prenotazione manuale inserita correttamente.",
    },
    { status: 201 },
  );
}