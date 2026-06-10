import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isValidDateKey(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function getTodayDateKey() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function deletePastClosedDays() {
  const today = getTodayDateKey();

  const { error } = await supabaseAdmin
    .from("closed_days")
    .delete()
    .lt("date", today);

  if (error) {
    console.error("Past closed days cleanup error:", error);
  }
}

export async function GET() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  await deletePastClosedDays();

  const { data, error } = await supabaseAdmin
    .from("closed_days")
    .select("id, date, reason, created_at")
    .order("date", { ascending: true });

  if (error) {
    console.error("Closed days fetch error:", error);

    return NextResponse.json(
      { error: "Errore durante il caricamento giorni chiusi." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    closedDays: data ?? [],
  });
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  let body: {
    date?: unknown;
    reason?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON non valido." },
      { status: 400 },
    );
  }

  if (!isValidDateKey(body.date)) {
    return NextResponse.json({ error: "Data non valida." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("closed_days")
    .insert({
      date: body.date,
      reason: normalizeOptionalString(body.reason),
    })
    .select("id, date, reason, created_at")
    .single();

  if (error) {
    console.error("Closed day insert error:", error);

    return NextResponse.json(
      { error: "Errore durante l’inserimento del giorno chiuso." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      closedDay: data,
    },
    { status: 201 },
  );
}