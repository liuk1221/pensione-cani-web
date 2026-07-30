"use client";

import { useMemo, useState } from "react";
import { formatDateKey, toDateKey } from "@/lib/date-utils";
import type {
  DayAvailability,
  DayAvailabilityStatus,
} from "@/lib/availability-types";

type AvailabilityCalendarMode = "public" | "booking" | "admin";

type SelectionState = "none" | "start" | "end" | "range";

type AvailabilityCalendarProps = {
  availabilityByDate: Record<string, DayAvailability>;
  mode?: AvailabilityCalendarMode;
  initialVisibleDate?: string | null;
  selectedStartDate?: string | null;
  selectedEndDate?: string | null;
  onDayClick?: (date: string) => void;
  isDayDisabled?: (date: string, availability?: DayAvailability) => boolean;
  disablePastDates?: boolean;
  allowedPastDateKeys?: string[];
  compact?: boolean;
};

const monthNames = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const firstWeekDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = lastDay.getDate();

  const days: Array<Date | null> = [];

  for (let i = 0; i < firstWeekDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function getStatusLabel(status: DayAvailabilityStatus) {
  switch (status) {
    case "available":
      return "Disponibile";
    case "limited":
      return "Pochi posti";
    case "full":
      return "Completo";
    case "closed":
      return "Chiuso";
    case "past":
      return "Passato";
    default:
      return "No Info";
  }
}

function getDayClasses(
  status: DayAvailabilityStatus,
  selectionState: SelectionState,
  disabled: boolean,
) {
  if (status === "past") {
    return "border-slate-200 bg-slate-100 text-slate-400 opacity-70";
  }

  if (selectionState === "start" || selectionState === "end") {
    return "border-blue-950 bg-blue-950 text-white ring-4 ring-yellow-300";
  }

  if (selectionState === "range") {
    return "border-blue-300 bg-blue-100 text-blue-950 ring-2 ring-blue-200";
  }

  const statusClasses = (() => {
    switch (status) {
      case "available":
        return "border-green-300 bg-green-100 text-green-900 hover:bg-green-200";
      case "limited":
        return "border-yellow-300 bg-yellow-100 text-yellow-900 hover:bg-yellow-200";
      case "full":
        return "border-red-300 bg-red-100 text-red-900";
      case "closed":
        return "border-slate-300 bg-slate-200 text-slate-500";
      default:
        return "border-slate-200 bg-white text-slate-500 hover:bg-slate-50";
    }
  })();

  if (disabled) {
    return `${statusClasses} opacity-50`;
  }

  return statusClasses;
}

export function AvailabilityCalendar({
  availabilityByDate,
  mode = "public",
  initialVisibleDate = null,
  selectedStartDate = null,
  selectedEndDate = null,
  onDayClick,
  isDayDisabled,
  disablePastDates = mode !== "admin",
  allowedPastDateKeys = [],
  compact = false,
}: AvailabilityCalendarProps) {
  const today = new Date();
  const todayKey = toDateKey(today);
  const initialDateParts = initialVisibleDate?.split("-").map(Number);

  const [visibleMonth, setVisibleMonth] = useState(
    initialDateParts?.length === 3 && initialDateParts.every(Number.isFinite)
      ? new Date(initialDateParts[0], initialDateParts[1] - 1, 1)
      : new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const allowedPastDates = useMemo(
    () => new Set(allowedPastDateKeys),
    [allowedPastDateKeys],
  );

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const calendarDays = useMemo(
    () => getCalendarDays(year, month),
    [year, month],
  );

  function goToPreviousMonth() {
    setVisibleMonth(new Date(year, month - 1, 1));
  }

  function goToNextMonth() {
    setVisibleMonth(new Date(year, month + 1, 1));
  }

  function getSelectionState(dateKey: string): SelectionState {
    if (dateKey === selectedStartDate) {
      return "start";
    }

    if (dateKey === selectedEndDate) {
      return "end";
    }

    if (
      selectedStartDate &&
      selectedEndDate &&
      dateKey > selectedStartDate &&
      dateKey < selectedEndDate
    ) {
      return "range";
    }

    return "none";
  }

  return (
    <div
      className={`min-w-0 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur ${
        compact ? "sm:p-4" : "sm:p-6"
      }`}
    >
      <div className="mb-4 flex min-w-0 items-center justify-between gap-2 sm:mb-6 sm:gap-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          aria-label="Mese precedente"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          ←
        </button>

        <div className="min-w-0 text-center">
          <h2 className="truncate text-lg font-bold text-slate-950 sm:text-xl">
            {monthNames[month]} {year}
          </h2>
          <p className="truncate text-xs text-slate-500 sm:text-sm">
            {mode === "admin"
              ? "Vista amministratore"
              : "Disponibilità indicativa"}
          </p>
        </div>

        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="Mese successivo"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          →
        </button>
      </div>

      <div
        className={`grid grid-cols-7 gap-1 text-center ${
          compact ? "" : "sm:gap-2"
        }`}
      >
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-[11px] font-bold uppercase text-slate-400 sm:text-xs"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} />;
          }

            const dateKey = toDateKey(date);
            const availability = availabilityByDate[dateKey];

            const isPastDate =
              disablePastDates &&
              dateKey < todayKey &&
              !allowedPastDates.has(dateKey);

            const status: DayAvailabilityStatus = isPastDate
            ? "past"
            : availability?.status ?? "unknown";

            const selectionState = isPastDate
              ? "none"
              : getSelectionState(dateKey);

            const disabledByRule = isDayDisabled?.(dateKey, availability) ?? false;
            const disabled = isPastDate || disabledByRule;

            const isClickable = Boolean(onDayClick) && !disabled;

          return (
            <button
              key={dateKey}
              type="button"
              disabled={!isClickable}
              aria-label={`${formatDateKey(dateKey)}: ${getStatusLabel(
                status,
              )}${
                availability && status !== "closed" && status !== "past"
                  ? `, ${availability.availableBoxes} su ${availability.totalBoxes} liberi`
                  : ""
              }`}
              onClick={() => onDayClick?.(dateKey)}
              className={`min-w-0 border text-center transition ${
                compact
                  ? "min-h-14 rounded-lg px-1 py-1.5 sm:min-h-[4.5rem] sm:rounded-xl sm:p-2"
                  : "min-h-14 rounded-lg px-0.5 py-1.5 sm:min-h-24 sm:rounded-2xl sm:p-2 sm:text-left"
              } ${getDayClasses(
              status,
              selectionState,
              disabled,
              )} ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`}
            >
              <div
                className={`flex items-start justify-center gap-1 ${
                  compact ? "" : "sm:justify-between"
                }`}
              >
                <span className="text-sm font-bold leading-none sm:text-sm sm:leading-normal">
                  {date.getDate()}
                </span>

                {!compact && (
                  <span className="availability-day-status rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold">
                    {getStatusLabel(status)}
                  </span>
                )}
              </div>

              {availability && status !== "closed" && status !== "past" && (
                <div
                  className={
                    compact
                      ? "mt-1 text-center text-[10px] font-bold leading-tight sm:text-xs"
                      : "mt-2 leading-none sm:mt-3 sm:text-xs sm:leading-normal"
                  }
                >
                  {compact ? (
                    <p>
                      {availability.availableBoxes}/{availability.totalBoxes}
                      <span className="hidden 2xl:inline"> liberi</span>
                    </p>
                  ) : (
                    <>
                      <p className="font-semibold">
                        <span className="availability-mobile-count">
                          {availability.availableBoxes}/
                          {availability.totalBoxes}
                        </span>
                        <span className="availability-desktop-count">
                          {availability.availableBoxes} /{" "}
                          {availability.totalBoxes} liberi
                        </span>
                      </p>

                      {mode === "admin" && (
                        <p className="mt-1 hidden opacity-80 sm:block">
                          {availability.occupiedBoxes} occupati
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-xs sm:mt-6 sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-400" />
          <span className="mt-1 text-slate-500">Disponibile</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="mt-1 text-slate-500">Pochi posti</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="mt-1 text-slate-500">Completo</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-300" />
          <span className="mt-1 text-slate-500">Chiuso</span>
        </div>

        {(selectedStartDate || selectedEndDate) && (
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-950 ring-2 ring-yellow-300" />
            <span className="mt-1 text-slate-500">Selezione</span>
          </div>
        )}
      </div>
    </div>
  );
}
