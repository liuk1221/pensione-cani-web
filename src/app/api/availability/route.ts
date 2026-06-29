import { NextRequest, NextResponse } from "next/server";
import { getPublicAvailability, isValidDateKey } from "@/lib/availability";
import {
  applyRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/request-security";

export async function GET(request: NextRequest) {
  //Evita polling aggressivo dell'endpoint pubblico.
  const rateLimit = applyRateLimit({
    key: `availability:${getClientIp(request)}`,
    limit: 120,
    windowMs: 60 * 1_000,
  });

  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

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

  //Impedisce query cronologiche troppo ampie e costose.
  const fromTime = Date.parse(`${from}T00:00:00Z`);
  const toTime = Date.parse(`${to}T00:00:00Z`);
  const requestedDays = (toTime - fromTime) / 86_400_000;

  if (requestedDays < 0 || requestedDays > 370) {
    return NextResponse.json(
      { error: "Intervallo di date non valido o troppo ampio." },
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

    //Non espone al client dettagli tecnici dell'errore interno.
    return NextResponse.json(
      {
        error: "Errore durante il caricamento della disponibilita.",
      },
      { status: 500 },
    );
  }
}
