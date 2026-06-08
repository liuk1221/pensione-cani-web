import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type AvailabilityRow = {
  day: string;
  total_boxes: number;
  occupied_boxes: number;
  blocked_boxes: number;
  available_boxes: number;
  status: "available" | "limited" | "full" | "closed";
};

function isValidDateKey(value: string | null) {
  if (!value) {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  console.log("Availability request:", { from, to });

  if (!isValidDateKey(from) || !isValidDateKey(to)) {
    return NextResponse.json(
      {
        error:
          "Parametri non validi. Usa il formato /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD",
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin.rpc("get_public_availability", {
    from_date: from,
    to_date: to,
  });

  if (error) {
    console.error("Supabase RPC error:", error);

    return NextResponse.json(
      {
        error: "Errore Supabase durante il caricamento della disponibilità.",
        details: error.message,
      },
      { status: 500 },
    );
  }

  console.log("Availability rows:", data?.length ?? 0);

  const rows = (data ?? []) as AvailabilityRow[];

  const availabilityByDate = Object.fromEntries(
    rows.map((row) => [
      row.day,
      {
        date: row.day,
        totalBoxes: row.total_boxes,
        occupiedBoxes: row.occupied_boxes + row.blocked_boxes,
        availableBoxes: row.available_boxes,
        status: row.status,
      },
    ]),
  );

  return NextResponse.json({
    availabilityByDate,
  });
}