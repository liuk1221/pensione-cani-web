import { PrenotazioniClient } from "@/app/prenotazioni/PrenotazioniClient";
import {
  getDefaultAvailabilityRange,
  getPublicAvailability,
} from "@/lib/availability";
import type { DayAvailability } from "@/lib/availability-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PrenotazioniPage() {
  const availabilityRange = getDefaultAvailabilityRange();
  let initialAvailabilityByDate: Record<string, DayAvailability> = {};
  let initialAvailabilityError: string | null = null;

  try {
    initialAvailabilityByDate = await getPublicAvailability(
      availabilityRange.from,
      availabilityRange.to,
    );
  } catch (error) {
    console.error("Prenotazioni availability preload error:", error);
    initialAvailabilityError =
      "Non e stato possibile caricare la disponibilita.";
  }

  return (
    <PrenotazioniClient
      availabilityRange={availabilityRange}
      initialAvailabilityByDate={initialAvailabilityByDate}
      initialAvailabilityError={initialAvailabilityError}
    />
  );
}
