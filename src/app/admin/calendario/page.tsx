"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AvailabilityCalendar,
  DayAvailability,
} from "@/components/availability/AvailabilityCalendar";
import { ManualBookingForm } from "@/components/admin/ManualBookingForm";
import {
  compareDateKeys,
  getDateKeysInRange,
  toDateKey,
} from "@/lib/date-utils";

export default function AdminCalendarioPage() {
  const availabilityRange = useMemo(() => {
    const today = new Date();

    const fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const toDate = new Date(today.getFullYear(), today.getMonth() + 12, 0);

    return {
      from: toDateKey(fromDate),
      to: toDateKey(toDate),
    };
  }, []);

  const [availabilityByDate, setAvailabilityByDate] = useState<
    Record<string, DayAvailability>
  >({});

  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );

  const [bookingSuccessMessage, setBookingSuccessMessage] = useState<
    string | null
  >(null);

  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(
    null,
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialAvailability() {
      try {
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

        if (!cancelled) {
          setAvailabilityByDate(payload.availabilityByDate ?? {});
          setAvailabilityError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setAvailabilityError(
            error instanceof Error
              ? error.message
              : "Non è stato possibile caricare la disponibilità.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAvailability(false);
        }
      }
    }

    void loadInitialAvailability();

    return () => {
      cancelled = true;
    };
  }, [availabilityRange.from, availabilityRange.to]);

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
      includeEnd: false,
    });
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

    if (!selectedStartDate || selectedEndDate) {
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
    setBookingSuccessMessage(null);

    if (!selectedStartDate || selectedEndDate) {
      if (!hasAvailableDate(date)) {
        setSelectionError(
          "La data di arrivo deve avere almeno uno slot libero.",
        );
        return;
      }

      setSelectedStartDate(date);
      setSelectedEndDate(null);
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

  async function handleBookingCreated() {
    await reloadAvailability();

    resetSelection();

    setBookingSuccessMessage(
      "Prenotazione inserita correttamente. Il calendario è stato aggiornato.",
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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

  const canCreateBooking = Boolean(selectedStartDate && selectedEndDate);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
            Area admin
          </p>

          <h1 className="text-4xl font-bold text-slate-950">
            Calendario prenotazioni
          </h1>

          <p className="mt-4 max-w-3xl text-slate-600">
            Visualizza la disponibilità reale e inserisci direttamente una
            prenotazione ricevuta da telefono, WhatsApp, email o di persona.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void reloadAvailability()}
          disabled={isLoadingAvailability}
          className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoadingAvailability ? "Caricamento..." : "Aggiorna calendario"}
        </button>
      </div>

      {bookingSuccessMessage && (
        <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          {bookingSuccessMessage}
        </div>
      )}

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

      <div className="mt-10 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <AvailabilityCalendar
            mode="booking"
            availabilityByDate={availabilityByDate}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
            onDayClick={handleDayClick}
            isDayDisabled={(date) => isDayDisabled(date)}
            disablePastDates={true}
          />

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Date selezionate
            </h2>

            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
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

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  resetSelection();
                  setBookingSuccessMessage(null);
                }}
                disabled={!selectedStartDate && !selectedEndDate}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset selezione
              </button>
            </div>

            {selectionError && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
                {selectionError}
              </div>
            )}

            <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">
              <p className="font-bold">Regola calendario</p>
              <p className="mt-2">
                Seleziona prima il giorno di arrivo e poi il giorno di uscita.
                Il giorno di uscita non occupa il box, quindi può essere
                selezionato anche se risulta pieno.
              </p>
            </div>
          </div>
        </div>

        <div className="xl:sticky xl:top-28 xl:self-start">
          {canCreateBooking && selectedStartDate && selectedEndDate ? (
            <ManualBookingForm
              startDate={selectedStartDate}
              endDate={selectedEndDate}
              stayLabel={stayLabel}
              onCreated={handleBookingCreated}
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-slate-950">
                Seleziona prima le date
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                Dopo aver scelto arrivo e uscita dal calendario, qui comparirà
                il form per inserire direttamente la prenotazione.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}