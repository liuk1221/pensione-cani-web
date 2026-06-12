import { NextRequest, NextResponse } from "next/server";
import { getPublicAvailability, isValidDateKey } from "@/lib/availability";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  if (!isValidDateKey(from) || !isValidDateKey(to)) {
    return NextResponse.json(
      {
        error:
          "Parametri non validi. Usa il formato /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD",
      },
      { status: 400 },
    );
  }

  try {
    const availabilityByDate = await getPublicAvailability(from, to);

    return NextResponse.json({
      availabilityByDate,
    });
  } catch (error) {
    console.error("Availability API error:", error);

    return NextResponse.json(
      {
        error: "Errore durante il caricamento della disponibilita.",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
