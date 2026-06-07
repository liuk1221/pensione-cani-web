"use client";

import { useState } from "react";
import {
  AvailabilityCalendar,
  DayAvailability,
} from "@/components/availability/AvailabilityCalendar";

const mockAvailability: Record<string, DayAvailability> = {
  "2026-06-10": {
    date: "2026-06-10",
    totalBoxes: 10,
    occupiedBoxes: 2,
    availableBoxes: 8,
    status: "available",
  },
  "2026-06-11": {
    date: "2026-06-11",
    totalBoxes: 10,
    occupiedBoxes: 8,
    availableBoxes: 2,
    status: "limited",
  },
  "2026-06-12": {
    date: "2026-06-12",
    totalBoxes: 10,
    occupiedBoxes: 10,
    availableBoxes: 0,
    status: "full",
  },
  "2026-06-13": {
    date: "2026-06-13",
    totalBoxes: 10,
    occupiedBoxes: 0,
    availableBoxes: 0,
    status: "closed",
  },
};

export default function PrenotazioniPage() {
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(
    null,
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);

  function handleDayClick(date: string) {
    if (!selectedStartDate || selectedEndDate) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      return;
    }

    if (date < selectedStartDate) {
      setSelectedStartDate(date);
      return;
    }

    setSelectedEndDate(date);
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
          Prenotazioni
        </p>

        <h1 className="text-4xl font-bold text-slate-950">
          Richiedi una prenotazione
        </h1>

        <p className="mt-4 text-slate-600">
          Seleziona le date desiderate. La richiesta verrà sempre confermata
          manualmente dalla struttura.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <AvailabilityCalendar
          mode="booking"
          availabilityByDate={mockAvailability}
          selectedStartDate={selectedStartDate}
          selectedEndDate={selectedEndDate}
          onDayClick={handleDayClick}
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Date selezionate
          </h2>

          <div className="mt-6 space-y-4 text-sm">
            <div>
              <p className="font-semibold text-slate-700">Arrivo</p>
              <p className="mt-1 text-slate-500">
                {selectedStartDate ?? "Non selezionato"}
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-700">Uscita</p>
              <p className="mt-1 text-slate-500">
                {selectedEndDate ?? "Non selezionato"}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-blue-50 p-4 text-sm text-blue-950">
            .. FORM MOCK ...
          </div>
        </div>
      </div>
    </section>
  );
}