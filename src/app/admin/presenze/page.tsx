"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AvailabilityCalendar } from "@/components/availability/AvailabilityCalendar";
import type { DayAvailability } from "@/lib/availability-types";
import type { BoxType } from "@/lib/box-types";
import {
  addDaysToDateKey,
  formatDateKey,
  toDateKey,
} from "@/lib/date-utils";

type PresenceDog = {
  id: string;
  name: string;
  breed: string | null;
  size: string;
};

type Presence = {
  bookingId: string;
  boxType: BoxType;
  boxCount: number;
  stayType: "day_care" | "overnight";
  startDate: string;
  endDate: string;
  expectedArrivalTime: string | null;
  expectedPickupTime: string | null;
  ownerName: string;
  dogs: PresenceDog[];
};

type PresencesResponse = {
  presences?: Presence[];
  error?: string;
};

type AvailabilityResponse = {
  availabilityByDate?: Record<string, DayAvailability>;
  error?: string;
};

const dogSizeLabels: Record<string, string> = {
  small: "Piccola",
  medium: "Media",
  large: "Grande",
  giant: "Gigante",
};

const zoneStyles: Record<
  BoxType,
  {
    container: string;
    marker: string;
    count: string;
    dogLink: string;
    title: string;
    description: string;
  }
> = {
  outdoor: {
    container:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-lime-50",
    marker: "bg-emerald-500 ring-emerald-100",
    count: "bg-emerald-100 text-emerald-900",
    dogLink:
      "border-emerald-200 bg-emerald-50 text-emerald-950 hover:border-emerald-400 hover:bg-emerald-100",
    title: "Box esterni",
    description: "Area all’aperto",
  },
  indoor: {
    container:
      "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50",
    marker: "bg-blue-600 ring-blue-100",
    count: "bg-blue-100 text-blue-900",
    dogLink:
      "border-blue-200 bg-blue-50 text-blue-950 hover:border-blue-400 hover:bg-blue-100",
    title: "Box interni",
    description: "Area coperta",
  },
};

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

function formatSelectedDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const formatted = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getPresenceTiming(presence: Presence, selectedDate: string) {
  const labels: string[] = [];
  const arrivalTime = formatTime(presence.expectedArrivalTime);
  const pickupTime = formatTime(presence.expectedPickupTime);

  if (presence.startDate === selectedDate) {
    labels.push(`Arrivo ${arrivalTime ?? "non indicato"}`);
  }

  if (presence.endDate === selectedDate) {
    labels.push(`Ritiro ${pickupTime ?? "non indicato"}`);
  }

  return labels.length > 0 ? labels.join(" · ") : "Permanenza in corso";
}

function PresenceZone({
  boxType,
  presences,
  selectedDate,
}: {
  boxType: BoxType;
  presences: Presence[];
  selectedDate: string;
}) {
  const styles = zoneStyles[boxType];
  const dogCount = presences.reduce(
    (total, presence) => total + presence.dogs.length,
    0,
  );
  const boxCount = presences.reduce(
    (total, presence) => total + presence.boxCount,
    0,
  );

  return (
    <section
      className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${styles.container}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`h-4 w-4 rounded-full ring-4 ${styles.marker}`}
            aria-hidden="true"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-950">{styles.title}</h2>
            <p className="text-sm text-slate-600">{styles.description}</p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${styles.count}`}
        >
          {dogCount} {dogCount === 1 ? "cane" : "cani"} · {boxCount}{" "}
          {boxCount === 1 ? "box" : "box"}
        </span>
      </div>

      {presences.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center">
          <p className="font-semibold text-slate-700">
            Nessun cane in quest’area
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Non risultano box occupati per la data selezionata.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {presences.map((presence, index) => (
            <article
              key={presence.bookingId}
              className="rounded-2xl border border-white bg-white/90 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Gruppo {String(index + 1).padStart(2, "0")} ·{" "}
                  {presence.boxCount} {presence.boxCount === 1 ? "box" : "box"}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  {presence.ownerName}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {presence.dogs.map((dog) => (
                  <Link
                    key={dog.id}
                    href={`/admin/prenotazioni?booking=${encodeURIComponent(
                      presence.bookingId,
                    )}`}
                    className={`group inline-flex min-h-11 items-center gap-3 rounded-2xl border px-4 py-2.5 font-bold transition ${styles.dogLink}`}
                    title={`Apri la prenotazione di ${dog.name}`}
                  >
                    <span>{dog.name}</span>
                    <span className="text-xs font-medium opacity-65">
                      {dog.breed ?? dogSizeLabels[dog.size] ?? dog.size}
                    </span>
                    <span
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                ))}
              </div>

              <p className="mt-3 text-xs font-medium text-slate-500">
                {getPresenceTiming(presence, selectedDate)}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminPresenzePage() {
  const todayKey = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [availabilityByDate, setAvailabilityByDate] = useState<
    Record<string, DayAvailability>
  >({});
  const [presences, setPresences] = useState<Presence[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [isLoadingPresences, setIsLoadingPresences] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const [presencesError, setPresencesError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const overviewRef = useRef<HTMLDivElement>(null);

  const availabilityRange = useMemo(() => {
    const today = new Date();

    return {
      from: toDateKey(new Date(today.getFullYear(), today.getMonth(), 1)),
      to: toDateKey(new Date(today.getFullYear(), today.getMonth() + 12, 0)),
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      try {
        setIsLoadingAvailability(true);
        setAvailabilityError(null);

        const response = await fetch(
          `/api/availability?from=${availabilityRange.from}&to=${availabilityRange.to}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as AvailabilityResponse;

        if (!response.ok) {
          throw new Error(
            payload.error ?? "Errore durante il caricamento del calendario.",
          );
        }

        if (!cancelled) {
          setAvailabilityByDate(payload.availabilityByDate ?? {});
        }
      } catch (error) {
        if (!cancelled) {
          setAvailabilityError(
            error instanceof Error
              ? error.message
              : "Non è stato possibile caricare il calendario.",
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
  }, [availabilityRange.from, availabilityRange.to, refreshVersion]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPresences() {
      try {
        setIsLoadingPresences(true);
        setPresencesError(null);

        const response = await fetch(
          `/api/admin/presences?date=${encodeURIComponent(selectedDate)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const payload = (await response.json()) as PresencesResponse;

        if (!response.ok) {
          throw new Error(
            payload.error ?? "Errore durante il caricamento delle presenze.",
          );
        }

        setPresences(payload.presences ?? []);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setPresencesError(
          error instanceof Error
            ? error.message
            : "Non è stato possibile caricare le presenze.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingPresences(false);
        }
      }
    }

    void loadPresences();

    return () => controller.abort();
  }, [refreshVersion, selectedDate]);

  const outdoorPresences = useMemo(
    () => presences.filter((presence) => presence.boxType === "outdoor"),
    [presences],
  );
  const indoorPresences = useMemo(
    () => presences.filter((presence) => presence.boxType === "indoor"),
    [presences],
  );
  const totalDogs = presences.reduce(
    (total, presence) => total + presence.dogs.length,
    0,
  );
  const totalBoxes = presences.reduce(
    (total, presence) => total + presence.boxCount,
    0,
  );

  function selectDateFromCalendar(date: string) {
    setSelectedDate(date);

    if (!window.matchMedia("(max-width: 767px)").matches) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.requestAnimationFrame(() => {
      overviewRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
            Area admin
          </p>
          <h1 className="text-4xl font-bold text-slate-950">
            Presenze nei box
          </h1>
          <p className="mt-4 max-w-3xl text-slate-600">
            Seleziona un giorno e visualizza subito tutti i cani presenti,
            separati tra area esterna e area interna.
          </p>
        </div>

        <button
          type="button"
          disabled={isLoadingAvailability || isLoadingPresences}
          onClick={() => setRefreshVersion((current) => current + 1)}
          className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoadingAvailability || isLoadingPresences
            ? "Aggiornamento..."
            : "Aggiorna presenze"}
        </button>
      </div>

      {(availabilityError || presencesError) && (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {availabilityError ?? presencesError}
        </div>
      )}

      <div className="mt-10 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="xl:sticky xl:top-28 xl:self-start">
          <AvailabilityCalendar
            key={selectedDate.slice(0, 7)}
            mode="admin"
            compact
            availabilityByDate={availabilityByDate}
            initialVisibleDate={selectedDate}
            selectedStartDate={selectedDate}
            selectedEndDate={selectedDate}
            onDayClick={selectDateFromCalendar}
            disablePastDates={false}
          />

          {isLoadingAvailability && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-950">
              Aggiornamento calendario in corso...
            </div>
          )}
        </div>

        <div
          ref={overviewRef}
          className="min-w-0 scroll-mt-24 space-y-5"
        >
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Giorno selezionato
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                  {formatSelectedDate(selectedDate)}
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  aria-label="Giorno precedente"
                  onClick={() =>
                    setSelectedDate((current) =>
                      addDaysToDateKey(current, -1),
                    )
                  }
                  className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-slate-300 bg-white px-3 font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayKey)}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-800 transition hover:bg-blue-100"
                >
                  Oggi
                </button>
                <button
                  type="button"
                  aria-label="Giorno successivo"
                  onClick={() =>
                    setSelectedDate((current) =>
                      addDaysToDateKey(current, 1),
                    )
                  }
                  className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-slate-300 bg-white px-3 font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  →
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
              <div>
                <p className="text-2xl font-bold text-slate-950">
                  {isLoadingPresences ? "—" : totalDogs}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Cani presenti
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-950">
                  {isLoadingPresences ? "—" : totalBoxes}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Box occupati
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-950">
                  {isLoadingPresences ? "—" : presences.length}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Prenotazioni
                </p>
              </div>
            </div>
          </div>

          {isLoadingPresences ? (
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-8 text-center font-medium text-blue-950">
              Caricamento dei cani presenti...
            </div>
          ) : (
            <>
              <PresenceZone
                boxType="outdoor"
                presences={outdoorPresences}
                selectedDate={selectedDate}
              />
              <PresenceZone
                boxType="indoor"
                presences={indoorPresences}
                selectedDate={selectedDate}
              />
            </>
          )}

          <p className="text-center text-xs leading-5 text-slate-500">
            Tocca il nome di un cane per aprire ed evidenziare la relativa
            prenotazione. Data selezionata: {formatDateKey(selectedDate)}.
          </p>
        </div>
      </div>
    </section>
  );
}
