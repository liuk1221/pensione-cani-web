"use client";

import { useMemo, useState } from "react";
import {
  AvailabilityCalendar,
  DayAvailability,
} from "@/components/availability/AvailabilityCalendar";
import {
  compareDateKeys,
  getDateKeysInRange,
  toDateKey,
} from "@/lib/date-utils";

const TOTAL_BOXES = 10;

function buildMockAvailability() {
  const result: Record<string, DayAvailability> = {};

  const today = new Date();
  const firstGeneratedDay = new Date(today.getFullYear(), today.getMonth(), 1);

  for (let index = 0; index < 150; index++) {
    const date = new Date(firstGeneratedDay);
    date.setDate(firstGeneratedDay.getDate() + index);

    const dateKey = toDateKey(date);
    const day = date.getDate();
    const month = date.getMonth();

    const isClosed = day === 13 || day === 27;
    const pattern = (day + month * 2) % 12;

    let occupiedBoxes = 0;

    if (isClosed) {
      occupiedBoxes = 0;
    } else if (pattern >= 10) {
      occupiedBoxes = TOTAL_BOXES;
    } else if (pattern >= 7) {
      occupiedBoxes = 8;
    } else {
      occupiedBoxes = 3;
    }

    const availableBoxes = isClosed ? 0 : TOTAL_BOXES - occupiedBoxes;

    let status: DayAvailability["status"];

    if (isClosed) {
      status = "closed";
    } else if (availableBoxes === 0) {
      status = "full";
    } else if (availableBoxes <= 3) {
      status = "limited";
    } else {
      status = "available";
    }

    result[dateKey] = {
      date: dateKey,
      totalBoxes: TOTAL_BOXES,
      occupiedBoxes,
      availableBoxes,
      status,
    };
  }

  return result;
}

export default function PrenotazioniPage() {
  const availabilityByDate = useMemo(() => buildMockAvailability(), []);

  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(
    null,
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  function hasAvailableNight(date: string) {
    const availability = availabilityByDate[date];

    return (
      availability !== undefined &&
      availability.status !== "closed" &&
      availability.availableBoxes > 0
    );
  }

  function getFirstUnavailableDate(startDate: string, endDate: string) {
    const occupiedDates = getOccupiedDatesForStay(startDate, endDate);

    return occupiedDates.find((date) => !hasAvailableNight(date)) ?? null;
  }

  function isValidEndDate(startDate: string, endDate: string) {
    if (compareDateKeys(endDate, startDate) < 0) {
      return false;
    }

    return getFirstUnavailableDate(startDate, endDate) === null;
  }

  function isDayDisabled(date: string) {
    if (!selectedStartDate || selectedEndDate) {
      return !hasAvailableNight(date);
    }

    if (date === selectedStartDate) {
      return false;
    }

    if (compareDateKeys(date, selectedStartDate) < 0) {
      return !hasAvailableNight(date);
    }

    return !isValidEndDate(selectedStartDate, date);
  }

  function getOccupiedDatesForStay(startDate: string, endDate: string) {
    if (startDate === endDate) {
      return [startDate];
    }

    return getDateKeysInRange(startDate, endDate, {
      includeEnd: false,
    });
  }

  function handleDayClick(date: string) {
    setSelectionError(null);

    if (!selectedStartDate || selectedEndDate) {
      if (!hasAvailableNight(date)) {
        setSelectionError("La data di arrivo deve avere almeno uno slot libero.");
        return;
      }

      setSelectedStartDate(date);
      setSelectedEndDate(null);
      return;
    }

    if (compareDateKeys(date, selectedStartDate) < 0) {
      if (!hasAvailableNight(date)) {
        setSelectionError(
          "La nuova data di arrivo deve avere almeno uno slot libero.",
        );
        return;
      }

      setSelectedStartDate(date);
      setSelectedEndDate(null);
      return;
    }

    const unavailableDate = getFirstUnavailableDate(selectedStartDate, date);

    if (unavailableDate) {
      setSelectionError(
        `L’intervallo contiene una data non disponibile: ${unavailableDate}.`,
      );
      return;
    }

    setSelectedEndDate(date);
  }

  function resetSelection() {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setSelectionError(null);
  }

  const occupiedDates =
    selectedStartDate && selectedEndDate
      ? getOccupiedDatesForStay(selectedStartDate, selectedEndDate)
      : [];

  const stayLabel =
    selectedStartDate && selectedEndDate
      ? selectedStartDate === selectedEndDate
        ? "Senza pernottamento"
        : `${occupiedDates.length} ${
            occupiedDates.length === 1 ? "notte" : "notti"
          }`
      : "-";

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
          Seleziona arrivo e uscita. La disponibilità viene calcolata a notti:
          il giorno di arrivo occupa un box, il giorno di uscita no.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <AvailabilityCalendar
          mode="booking"
          availabilityByDate={availabilityByDate}
          selectedStartDate={selectedStartDate}
          selectedEndDate={selectedEndDate}
          onDayClick={handleDayClick}
          isDayDisabled={(date) => isDayDisabled(date)}
          disablePastDates={true}
        />

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

            <div>
              <p className="font-semibold text-slate-700">Permanenza</p>
              <p className="mt-1 text-slate-500">{stayLabel}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetSelection}
            disabled={!selectedStartDate && !selectedEndDate}
            className="mt-6 w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset selezione
          </button>

          {selectionError && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
              {selectionError}
            </div>
          )}

          <div className="mt-8 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">
            <p className="font-bold">Regola disponibilità</p>
            <p className="mt-2">
              Il giorno di arrivo è il giorno in cui si effettuerà il check-in.
              Il giorno di uscita è il giorno in cui si effettuerà il check-out.
              Entrambi vanno eseguiti rispettando gli orari concordati con il personale. 
            </p>
          </div>

          <div className="mt-6 rounded-2xl bg-yellow-50 p-4 text-sm leading-6 text-yellow-950">
            .. FORM MOCK ...
          </div>
        </aside>
      </div>
    </section>
  );
}