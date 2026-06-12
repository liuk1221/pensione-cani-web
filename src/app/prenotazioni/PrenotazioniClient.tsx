"use client";

import { useRef, useState } from "react";
import { AvailabilityCalendar } from "@/components/availability/AvailabilityCalendar";
import { BookingRequestForm } from "@/components/bookings/BookingRequestForm";
import type { DayAvailability } from "@/lib/availability-types";
import {
  compareDateKeys,
  formatDateKey,
  getDateKeysInRange,
} from "@/lib/date-utils";

type PrenotazioniClientProps = {
  availabilityRange: {
    from: string;
    to: string;
  };
  initialAvailabilityByDate: Record<string, DayAvailability>;
  initialAvailabilityError: string | null;
};

export function PrenotazioniClient({
  availabilityRange,
  initialAvailabilityByDate,
  initialAvailabilityError,
}: PrenotazioniClientProps) {
  const formSectionRef = useRef<HTMLDivElement | null>(null);

  const [availabilityByDate, setAvailabilityByDate] = useState<
    Record<string, DayAvailability>
  >(initialAvailabilityByDate);

  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    initialAvailabilityError,
  );

  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(
    null,
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);


  async function reloadAvailability() {
    try {
      setIsLoadingAvailability(true);
      setAvailabilityError(null);

      const response = await fetch(
        `/api/availability?from=${availabilityRange.from}&to=${availabilityRange.to}`,
        {
          cache: "no-store",
        },
      );

      const payload = (await response.json()) as {
        availabilityByDate?: Record<string, DayAvailability>;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ?? "Errore durante il caricamento disponibilità.",
        );
      }

      setAvailabilityByDate(payload.availabilityByDate ?? {});
    } catch (error) {
      setAvailabilityError(
        error instanceof Error
          ? error.message
          : "Non è stato possibile caricare la disponibilità.",
      );
    } finally {
      setIsLoadingAvailability(false);
    }
  }

  function hasAvailableDate(date: string) {
    const availability = availabilityByDate[date];

    return (
      availability !== undefined &&
      availability.status !== "closed" &&
      availability.status !== "full" &&
      availability.availableBoxes > 0
    );
  }

  function getOccupiedDatesForStay(startDate: string, endDate: string) {
    if (startDate === endDate) {
      return [startDate];
    }

    return getDateKeysInRange(startDate, endDate, {
      includeEnd: true,
    });
  }

  function getStayNights(startDate: string, endDate: string) {
    if (startDate === endDate) {
      return 0;
    }

    return getDateKeysInRange(startDate, endDate).length;
  }

  function getFirstUnavailableDate(startDate: string, endDate: string) {
    const occupiedDates = getOccupiedDatesForStay(startDate, endDate);

    return occupiedDates.find((date) => !hasAvailableDate(date)) ?? null;
  }

  function isValidEndDate(startDate: string, endDate: string) {
    if (compareDateKeys(endDate, startDate) < 0) {
      return false;
    }

    return getFirstUnavailableDate(startDate, endDate) === null;
  }

  function isDayDisabled(date: string) {
    if (isLoadingAvailability) {
      return true;
    }

    const hasCompletedRange =
      selectedStartDate &&
      selectedEndDate &&
      selectedStartDate !== selectedEndDate;

    if (!selectedStartDate || hasCompletedRange) {
      return !hasAvailableDate(date);
    }

    if (date === selectedStartDate) {
      return false;
    }

    if (compareDateKeys(date, selectedStartDate) < 0) {
      return !hasAvailableDate(date);
    }

    return !isValidEndDate(selectedStartDate, date);
  }

  function handleDayClick(date: string) {
    setSelectionError(null);

    const hasCompletedRange =
      selectedStartDate &&
      selectedEndDate &&
      selectedStartDate !== selectedEndDate;

    if (!selectedStartDate || hasCompletedRange) {
      if (!hasAvailableDate(date)) {
        setSelectionError(
          "La data di arrivo deve avere almeno uno slot libero.",
        );
        return;
      }

      setSelectedStartDate(date);
      setSelectedEndDate(date);
      return;
    }

    if (compareDateKeys(date, selectedStartDate) < 0) {
      if (!hasAvailableDate(date)) {
        setSelectionError(
          "La nuova data di arrivo deve avere almeno uno slot libero.",
        );
        return;
      }

      setSelectedStartDate(date);
      setSelectedEndDate(date);
      return;
    }

    const unavailableDate = getFirstUnavailableDate(selectedStartDate, date);

    if (unavailableDate) {
      setSelectionError(
        "Intervallo non disponibile: " + formatDateKey(unavailableDate) + ".",
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

  function scrollToForm() {
    if (!selectedStartDate || !selectedEndDate) {
      setSelectionError(
        "Seleziona prima una data di arrivo e una data di uscita.",
      );
      return;
    }

    formSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const stayNights =
    selectedStartDate && selectedEndDate
      ? getStayNights(selectedStartDate, selectedEndDate)
      : 0;

  const stayLabel =
    selectedStartDate && selectedEndDate
      ? selectedStartDate === selectedEndDate
        ? "Senza pernottamento"
        : `${stayNights} ${stayNights === 1 ? "notte" : "notti"}`
      : "-";

  const canContinue = Boolean(selectedStartDate && selectedEndDate);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
            Prenotazioni
          </p>

          <h1 className="text-4xl font-bold text-slate-950">
            Richiedi una prenotazione
          </h1>

          <p className="mt-4 text-slate-600">
            Tocca un giorno per selezionarlo come arrivo e uscita. Con un
            secondo tocco puoi impostare l&apos;uscita e creare un intervallo. In
            caso di pernottamento, il giorno di uscita occupa il box.
          </p>
        </div>

        <button
          type="button"
          onClick={reloadAvailability}
          disabled={isLoadingAvailability}
          className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoadingAvailability ? "Caricamento..." : "Aggiorna disponibilità"}
        </button>
      </div>

      {isLoadingAvailability && (
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-950">
          Caricamento disponibilità in corso...
        </div>
      )}

      {availabilityError && (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {availabilityError}
        </div>
      )}

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
                {selectedStartDate
                  ? formatDateKey(selectedStartDate)
                  : "Non selezionato"}
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-700">Uscita</p>
              <p className="mt-1 text-slate-500">
                {selectedEndDate
                  ? formatDateKey(selectedEndDate)
                  : "Non selezionato"}
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

          <button
            type="button"
            onClick={scrollToForm}
            disabled={!canContinue}
            className="mt-4 w-full rounded-full bg-yellow-400 px-5 py-3 text-sm font-bold text-blue-950 shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continua con la richiesta
          </button>

          {selectionError && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
              {selectionError}
            </div>
          )}

          <div className="mt-8 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">
            <p className="font-bold">Regola disponibilità</p>
            <p className="mt-2">
              Il giorno di uscita viene considerato occupato per il box. La
              prenotazione può avvenire attraverso tutti i canali disponibili
              tra i contatti. Le richieste sono da ritenersi{" "}
              <u>confermate solo una volta accettate dalla struttura</u>.
            </p>
          </div>
        </aside>
      </div>

      <div ref={formSectionRef} className="mt-14 scroll-mt-28">
        {canContinue ? (
          <BookingRequestForm
            startDate={selectedStartDate}
            endDate={selectedEndDate}
            stayLabel={stayLabel}
          />
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">
              Completa prima la selezione delle date
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Dopo aver scelto arrivo e uscita dal calendario, potrai compilare
              il modulo con i dati del proprietario e del cane.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
