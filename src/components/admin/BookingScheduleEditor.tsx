"use client";

import { useEffect, useMemo, useState } from "react";
import { AvailabilityCalendar } from "@/components/availability/AvailabilityCalendar";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import type { DayAvailability } from "@/lib/availability-types";
import {
  compareDateKeys,
  formatDateKey,
  fromDateKey,
  getDateKeysInRange,
  toDateKey,
} from "@/lib/date-utils";
import { calculateBookingEstimate, formatEuro } from "@/lib/pricing";

type BookingScheduleEditorProps = {
  booking: {
    id: string;
    status: "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
    startDate: string;
    endDate: string;
    expectedArrivalTime: string | null;
    expectedPickupTime: string | null;
    dogNames: string;
    dogSizes: string[];
    extraServiceIds: string[];
  };
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

type ApiResponse = {
  error?: string;
  unavailableDays?: string[];
  availabilityByDate?: Record<string, DayAvailability>;
};

async function readJsonResponse(response: Response): Promise<ApiResponse> {
  const text = await response.text();

  if (!text) {
    return { error: `Risposta vuota dal server. HTTP ${response.status}` };
  }

  try {
    return JSON.parse(text) as ApiResponse;
  } catch {
    return {
      error: `Risposta non valida dal server. HTTP ${response.status}`,
    };
  }
}

function getAvailabilityRange(startDate: string, endDate: string) {
  const today = new Date();
  const bookingStart = fromDateKey(startDate);
  const bookingEnd = fromDateKey(endDate);
  const firstCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstBookingMonth = new Date(
    bookingStart.getFullYear(),
    bookingStart.getMonth(),
    1,
  );
  const fromDate =
    firstBookingMonth < firstCurrentMonth ? firstBookingMonth : firstCurrentMonth;
  const twelveMonthsFromNow = new Date(
    today.getFullYear(),
    today.getMonth() + 12,
    0,
  );
  const rangeEnd = bookingEnd > twelveMonthsFromNow
    ? new Date(bookingEnd.getFullYear(), bookingEnd.getMonth() + 1, 0)
    : twelveMonthsFromNow;

  return {
    from: toDateKey(fromDate),
    to: toDateKey(rangeEnd),
  };
}

export function BookingScheduleEditor({
  booking,
  onClose,
  onSaved,
}: BookingScheduleEditorProps) {
  const todayKey = toDateKey(new Date());
  const isStartDateLocked = booking.startDate < todayKey;
  const availabilityRange = useMemo(
    () => getAvailabilityRange(booking.startDate, booking.endDate),
    [booking.endDate, booking.startDate],
  );
  const [stage, setStage] = useState<"edit" | "confirm">("edit");
  const [startDate, setStartDate] = useState<string | null>(booking.startDate);
  const [endDate, setEndDate] = useState<string | null>(booking.endDate);
  const [expectedArrivalTime, setExpectedArrivalTime] = useState(
    booking.expectedArrivalTime?.slice(0, 5) ?? "",
  );
  const [expectedPickupTime, setExpectedPickupTime] = useState(
    booking.expectedPickupTime?.slice(0, 5) ?? "",
  );
  const [availabilityByDate, setAvailabilityByDate] = useState<
    Record<string, DayAvailability>
  >({});
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      try {
        setIsLoadingAvailability(true);
        const response = await fetch(
          `/api/admin/bookings/${booking.id}?from=${availabilityRange.from}&to=${availabilityRange.to}`,
          { cache: "no-store" },
        );
        const payload = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(
            payload.error ?? "Errore durante il caricamento della disponibilita.",
          );
        }

        if (!cancelled) {
          setAvailabilityByDate(payload.availabilityByDate ?? {});
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Errore durante il caricamento della disponibilita.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAvailability(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [availabilityRange.from, availabilityRange.to, booking.id]);

  const estimate = useMemo(
    () =>
      calculateBookingEstimate({
        startDate: startDate ?? booking.startDate,
        endDate: endDate ?? startDate ?? booking.endDate,
        dogs: booking.dogSizes.map((size) => ({ size })),
        extraServiceIds: booking.extraServiceIds,
        expectedPickupTime,
      }),
    [
      booking.dogSizes,
      booking.endDate,
      booking.extraServiceIds,
      booking.startDate,
      endDate,
      expectedPickupTime,
      startDate,
    ],
  );

  function hasAvailableDate(date: string) {
    const availability = availabilityByDate[date];

    return Boolean(
      availability &&
        availability.status !== "closed" &&
        availability.status !== "full" &&
        availability.availableBoxes > 0,
    );
  }

  function getFirstUnavailableDate(rangeStart: string, rangeEnd: string) {
    const days =
      rangeStart === rangeEnd
        ? [rangeStart]
        : getDateKeysInRange(rangeStart, rangeEnd, { includeEnd: true });

    return (
      days.find(
        (date) =>
          (!isStartDateLocked || date >= todayKey) && !hasAvailableDate(date),
      ) ?? null
    );
  }

  function isValidRange(rangeStart: string, rangeEnd: string) {
    return (
      compareDateKeys(rangeEnd, rangeStart) >= 0 &&
      getFirstUnavailableDate(rangeStart, rangeEnd) === null
    );
  }

  function isDayDisabled(date: string) {
    if (isLoadingAvailability) {
      return true;
    }

    if (isStartDateLocked) {
      if (date === booking.startDate || date < todayKey || date < booking.startDate) {
        return true;
      }

      return !isValidRange(booking.startDate, date);
    }

    const hasCompletedRange =
      startDate && endDate && startDate !== endDate;

    if (!startDate || hasCompletedRange) {
      return !hasAvailableDate(date);
    }

    if (date === startDate) {
      return false;
    }

    if (compareDateKeys(date, startDate) < 0) {
      return !hasAvailableDate(date);
    }

    return !isValidRange(startDate, date);
  }

  function handleDayClick(date: string) {
    setError(null);

    if (isStartDateLocked) {
      setEndDate(date);
      return;
    }

    const hasCompletedRange =
      startDate && endDate && startDate !== endDate;

    if (!startDate || hasCompletedRange) {
      setStartDate(date);
      setEndDate(date);
      return;
    }

    if (compareDateKeys(date, startDate) < 0) {
      setStartDate(date);
      setEndDate(date);
      return;
    }

    setEndDate(date);
  }

  function proceedToConfirmation() {
    setError(null);

    if (!startDate || !endDate || !isValidRange(startDate, endDate)) {
      const unavailableDate =
        startDate && endDate
          ? getFirstUnavailableDate(startDate, endDate)
          : null;
      setError(
        unavailableDate
          ? `Intervallo non disponibile dal ${formatDateKey(unavailableDate)}.`
          : "Seleziona un intervallo di date valido.",
      );
      return;
    }

    if (!expectedPickupTime) {
      setError("Inserisci l'orario previsto di ritiro.");
      return;
    }

    if (
      startDate === endDate &&
      expectedArrivalTime &&
      expectedPickupTime <= expectedArrivalTime
    ) {
      setError(
        "L'orario di ritiro deve essere successivo all'orario di arrivo.",
      );
      return;
    }

    setStage("confirm");
  }

  async function saveChanges() {
    if (!startDate || !endDate) {
      setStage("edit");
      setError("Seleziona un intervallo di date valido.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: booking.status,
          updateSchedule: true,
          startDate,
          endDate,
          expectedArrivalTime,
          expectedPickupTime,
        }),
      });
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        const unavailableDates = payload.unavailableDays?.length
          ? ` Date non disponibili: ${payload.unavailableDays
              .map(formatDateKey)
              .join(", ")}.`
          : "";
        throw new Error(
          `${payload.error ?? "Errore durante la modifica della prenotazione."}${unavailableDates}`,
        );
      }

      await onSaved();
    } catch (saveError) {
      setStage("edit");
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Errore durante la modifica della prenotazione.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (stage === "confirm") {
    return (
      <ResponsiveDialog
        isOpen
        title="Confermare la modifica?"
        confirmLabel="Conferma modifica"
        cancelLabel="Torna a date e orari"
        isConfirming={isSaving}
        onClose={() => setStage("edit")}
        onConfirm={() => void saveChanges()}
      >
        <p>
          Vuoi aggiornare la prenotazione di{" "}
          <span className="font-bold text-slate-900">{booking.dogNames}</span>?
        </p>
        <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-blue-950">
          <p>
            {formatDateKey(startDate ?? booking.startDate)} alle{" "}
            {expectedArrivalTime || "orario non indicato"}
          </p>
          <p>
            fino al {formatDateKey(endDate ?? booking.endDate)} alle{" "}
            {expectedPickupTime}
          </p>
          <p className="mt-2 text-lg font-bold">
            Nuovo preventivo: {formatEuro(estimate.totalCents)}
          </p>
        </div>
      </ResponsiveDialog>
    );
  }

  return (
    <ResponsiveDialog
      isOpen
      size="wide"
      title={`Modifica prenotazione: ${booking.dogNames}`}
      confirmLabel="Continua"
      cancelLabel="Annulla"
      onClose={onClose}
      onConfirm={proceedToConfirmation}
    >
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div>
          {isLoadingAvailability ? (
            <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 font-medium text-blue-950">
              Caricamento disponibilita in corso...
            </div>
          ) : null}

          <AvailabilityCalendar
            mode="booking"
            availabilityByDate={availabilityByDate}
            initialVisibleDate={
              booking.startDate < todayKey ? todayKey : booking.startDate
            }
            selectedStartDate={startDate}
            selectedEndDate={endDate}
            onDayClick={handleDayClick}
            isDayDisabled={isDayDisabled}
            disablePastDates
            allowedPastDateKeys={
              isStartDateLocked ? [booking.startDate] : []
            }
          />
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl bg-blue-50 p-4 text-blue-950">
            <p className="font-bold">Date selezionate</p>
            <p className="mt-2">
              Arrivo: {startDate ? formatDateKey(startDate) : "-"}
            </p>
            <p>Uscita: {endDate ? formatDateKey(endDate) : "-"}</p>
            {isStartDateLocked ? (
              <p className="mt-3 text-xs font-semibold leading-5">
                L&apos;arrivo e gia trascorso ed e bloccato. Puoi modificare
                l&apos;uscita e gli orari.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setError(null);
                }}
                className="mt-3 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-800 transition hover:bg-blue-100"
              >
                Riseleziona le date
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Orario arrivo
              <input
                type="time"
                value={expectedArrivalTime}
                onChange={(event) => setExpectedArrivalTime(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Orario ritiro
              <input
                type="time"
                required
                value={expectedPickupTime}
                onChange={(event) => setExpectedPickupTime(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-5 text-slate-800">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-800">
              Preventivo aggiornato
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-950">
              {expectedPickupTime ? formatEuro(estimate.totalCents) : "-"}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Il totale viene ricalcolato automaticamente in base alle nuove
              date, all&apos;orario di ritiro, ai cani e ai servizi gia selezionati.
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-medium text-red-800">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
