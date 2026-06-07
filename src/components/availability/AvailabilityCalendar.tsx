"use client";

import { useMemo, useState } from "react";
import { toDateKey } from "@/lib/date-utils";

export type DayAvailabilityStatus =
  | "available"
  | "limited"
  | "full"
  | "closed"
  | "unknown";

export type DayAvailability = {
  date: string;
  totalBoxes: number;
  occupiedBoxes: number;
  availableBoxes: number;
  status: DayAvailabilityStatus;
};

type AvailabilityCalendarMode = "public" | "booking" | "admin";

type SelectionState = "none" | "start" | "end" | "range";

type AvailabilityCalendarProps = {
  availabilityByDate: Record<string, DayAvailability>;
  mode?: AvailabilityCalendarMode;
  selectedStartDate?: string | null;
  selectedEndDate?: string | null;
  onDayClick?: (date: string) => void;
  isDayDisabled?: (date: string, availability?: DayAvailability) => boolean;
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
    default:
      return "Da verificare";
  }
}

function getDayClasses(
  status: DayAvailabilityStatus,
  selectionState: SelectionState,
  disabled: boolean,
) {
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
  selectedStartDate = null,
  selectedEndDate = null,
  onDayClick,
  isDayDisabled,
}: AvailabilityCalendarProps) {
  const today = new Date();

  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
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
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          ←
        </button>

        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-950">
            {monthNames[month]} {year}
          </h2>
          <p className="text-sm text-slate-500">
            {mode === "admin"
              ? "Vista amministratore"
              : "Disponibilità indicativa"}
          </p>
        </div>

        <button
          type="button"
          onClick={goToNextMonth}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center sm:gap-2">
        {weekDays.map((day) => (
          <div key={day} className="text-xs font-bold uppercase text-slate-400">
            {day}
          </div>
        ))}

        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} />;
          }

          const dateKey = toDateKey(date);
          const availability = availabilityByDate[dateKey];

          const status = availability?.status ?? "unknown";
          const selectionState = getSelectionState(dateKey);
          const disabledByRule = isDayDisabled?.(dateKey, availability) ?? false;

          const isClickable = Boolean(onDayClick) && !disabledByRule;

          return (
            <button
              key={dateKey}
              type="button"
              disabled={!isClickable}
              onClick={() => onDayClick?.(dateKey)}
              className={`min-h-20 rounded-2xl border p-2 text-left transition sm:min-h-24 ${getDayClasses(
                status,
                selectionState,
                disabledByRule,
              )} ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-sm font-bold">{date.getDate()}</span>

                <span className="rounded-full bg-white/70 px-1.5 py-1 text-[9px] font-bold sm:px-2 sm:text-[10px]">
                  {getStatusLabel(status)}
                </span>
              </div>

              {availability && status !== "closed" && (
                <div className="mt-3 text-xs">
                  <p className="font-semibold">
                    {availability.availableBoxes} / {availability.totalBoxes}{" "}
                    liberi
                  </p>

                  {mode === "admin" && (
                    <p className="mt-1 opacity-80">
                      {availability.occupiedBoxes} occupati
                    </p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
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