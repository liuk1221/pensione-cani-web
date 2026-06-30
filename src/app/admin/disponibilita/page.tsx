"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatDateKey } from "@/lib/date-utils";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import { getBoxTypeLabel } from "@/lib/box-types";

type Settings = {
  id: number;
  total_boxes: number;
  outdoor_boxes: number | null;
  indoor_boxes: number | null;
  business_email: string | null;
  notification_email: string | null;
};

type ClosedDay = {
  id: string;
  date: string;
  reason: string | null;
  created_at: string;
};

type AvailabilityOverride = {
  id: string;
  date: string;
  blocked_boxes: number;
  box_type: string | null;
  reason: string | null;
  created_at: string;
};

export default function AdminDisponibilitaPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [closedDays, setClosedDays] = useState<ClosedDay[]>([]);
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [deletingAvailabilityId, setDeletingAvailabilityId] = useState<
    string | null
  >(null);
  const [closedDayPendingDeletion, setClosedDayPendingDeletion] =
    useState<ClosedDay | null>(null);
  const [overridePendingDeletion, setOverridePendingDeletion] =
    useState<AvailabilityOverride | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);

      const [settingsResponse, closedDaysResponse, overridesResponse] =
        await Promise.all([
          fetch("/api/admin/settings", { cache: "no-store" }),
          fetch("/api/admin/closed-days", { cache: "no-store" }),
          fetch("/api/admin/availability-overrides", { cache: "no-store" }),
        ]);

      const settingsPayload = await settingsResponse.json();
      const closedDaysPayload = await closedDaysResponse.json();
      const overridesPayload = await overridesResponse.json();

      if (!settingsResponse.ok) {
        throw new Error(
          settingsPayload.error ?? "Errore caricamento impostazioni.",
        );
      }

      if (!closedDaysResponse.ok) {
        throw new Error(
          closedDaysPayload.error ?? "Errore caricamento giorni chiusi.",
        );
      }

      if (!overridesResponse.ok) {
        throw new Error(
          overridesPayload.error ?? "Errore caricamento blocchi manuali.",
        );
      }

      setSettings(settingsPayload.settings);
      setClosedDays(closedDaysPayload.closedDays ?? []);
      setOverrides(overridesPayload.overrides ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Errore durante il caricamento dati.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const outdoorBoxes = Number(formData.get("outdoorBoxes"));
    const indoorBoxes = Number(formData.get("indoorBoxes"));

    try {
      setIsSavingSettings(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outdoorBoxes,
          indoorBoxes,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Errore aggiornamento impostazioni.");
      }

      setSettings((current) =>
        current
          ? {
              ...current,
              total_boxes: payload.settings.total_boxes,
              outdoor_boxes: payload.settings.outdoor_boxes,
              indoor_boxes: payload.settings.indoor_boxes,
            }
          : current,
      );

      setSuccessMessage("Numero box aggiornato correttamente.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Errore aggiornamento impostazioni.",
      );
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleClosedDaySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const date = String(formData.get("date") ?? "");
    const reason = String(formData.get("reason") ?? "");

    try {
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/admin/closed-days", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          reason,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Errore inserimento giorno chiuso.");
      }

      setClosedDays((current) => [...current, payload.closedDay]);
      setSuccessMessage("Giorno chiuso aggiunto correttamente.");
      form.reset();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Errore inserimento giorno chiuso.",
      );
    }
  }

  async function handleOverrideSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const date = String(formData.get("date") ?? "");
    const blockedBoxes = Number(formData.get("blockedBoxes"));
    const boxType = String(formData.get("boxType") ?? "");
    const reason = String(formData.get("reason") ?? "");

    try {
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/admin/availability-overrides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          blockedBoxes,
          boxType,
          reason,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Errore inserimento blocco manuale.");
      }

      setOverrides((current) => [...current, payload.override]);
      setSuccessMessage("Blocco manuale aggiunto correttamente.");
      form.reset();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Errore inserimento blocco manuale.",
      );
    }
  }

  async function deleteClosedDay(id: string) {
    try {
      setClosedDayPendingDeletion(null);
      setDeletingAvailabilityId(id);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/admin/closed-days/${id}`, {
        method: "DELETE",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Errore eliminazione giorno chiuso.");
      }

      setClosedDays((current) => current.filter((item) => item.id !== id));
      setSuccessMessage("Giorno chiuso eliminato.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Errore eliminazione giorno chiuso.",
      );
    } finally {
      setDeletingAvailabilityId(null);
    }
  }

  async function deleteOverride(id: string) {
    try {
      setOverridePendingDeletion(null);
      setDeletingAvailabilityId(id);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/admin/availability-overrides/${id}`, {
        method: "DELETE",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Errore eliminazione blocco manuale.");
      }

      setOverrides((current) => current.filter((item) => item.id !== id));
      setSuccessMessage("Blocco manuale eliminato.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Errore eliminazione blocco manuale.",
      );
    } finally {
      setDeletingAvailabilityId(null);
    }
  }

    useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
        try {
        const [settingsResponse, closedDaysResponse, overridesResponse] =
            await Promise.all([
            fetch("/api/admin/settings", { cache: "no-store" }),
            fetch("/api/admin/closed-days", { cache: "no-store" }),
            fetch("/api/admin/availability-overrides", { cache: "no-store" }),
            ]);

        const settingsPayload = await settingsResponse.json();
        const closedDaysPayload = await closedDaysResponse.json();
        const overridesPayload = await overridesResponse.json();

        if (!settingsResponse.ok) {
            throw new Error(
            settingsPayload.error ?? "Errore caricamento impostazioni.",
            );
        }

        if (!closedDaysResponse.ok) {
            throw new Error(
            closedDaysPayload.error ?? "Errore caricamento giorni chiusi.",
            );
        }

        if (!overridesResponse.ok) {
            throw new Error(
            overridesPayload.error ?? "Errore caricamento blocchi manuali.",
            );
        }

        if (!cancelled) {
            setSettings(settingsPayload.settings);
            setClosedDays(closedDaysPayload.closedDays ?? []);
            setOverrides(overridesPayload.overrides ?? []);
            setError(null);
        }
        } catch (error) {
        if (!cancelled) {
            setError(
            error instanceof Error
                ? error.message
                : "Errore durante il caricamento dati.",
            );
        }
        } finally {
        if (!cancelled) {
            setIsLoading(false);
        }
        }
    }

    void loadInitialData();

    return () => {
        cancelled = true;
    };
    }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
            Area admin
          </p>

          <h1 className="text-4xl font-bold text-slate-950">
            Gestione disponibilità
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">
            Modifica il numero totale di box, aggiungi giorni chiusi e blocca
            manualmente alcuni box in date specifiche.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Aggiorna dati
        </button>
      </div>

      {error && (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
          Caricamento disponibilità...
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Numero box
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Questo valore viene usato per calcolare la disponibilità
                pubblica del calendario.
              </p>

              <form onSubmit={handleSettingsSubmit} className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Box esterni
                    </label>

                    <input
                      name="outdoorBoxes"
                      type="number"
                      min="0"
                      required
                      defaultValue={
                        settings?.outdoor_boxes ?? settings?.total_boxes ?? 0
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Box interni
                    </label>

                    <input
                      name="indoorBoxes"
                      type="number"
                      min="0"
                      required
                      defaultValue={settings?.indoor_boxes ?? 0}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Totale attuale: {settings?.total_boxes ?? 0}
                </p>

                <div className="hidden">
                  <label className="text-sm font-semibold text-slate-700">
                    Box disponibili totali
                  </label>

                  <input
                    name="totalBoxes"
                    type="number"
                    min="0"
                    required
                    disabled
                    defaultValue={settings?.total_boxes ?? 0}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-blue-950 shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingSettings ? "Salvataggio..." : "Salva box"}
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Aggiungi giorno chiuso
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Un giorno chiuso viene mostrato come non prenotabile nel
                calendario pubblico.
              </p>

              <form onSubmit={handleClosedDaySubmit} className="mt-6 space-y-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Data
                  </label>

                  <input
                    name="date"
                    type="date"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Motivo
                  </label>

                  <input
                    name="reason"
                    type="text"
                    placeholder="Es. manutenzione, chiusura straordinaria..."
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-blue-950 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900"
                >
                  Aggiungi giorno chiuso
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Blocca box manualmente
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Usa questa funzione per ridurre temporaneamente la disponibilità
                di una data, ad esempio per manutenzione o gestione interna.
              </p>

              <form onSubmit={handleOverrideSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Data
                  </label>

                  <input
                    name="date"
                    type="date"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Box da bloccare
                  </label>

                  <input
                    name="blockedBoxes"
                    type="number"
                    min="1"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Tipologia box
                  </label>

                  <select
                    name="boxType"
                    defaultValue="outdoor"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="outdoor">Box esterno</option>
                    <option value="indoor">Box interno</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Motivo
                  </label>

                  <input
                    name="reason"
                    type="text"
                    placeholder="Es. box in manutenzione..."
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-blue-950 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900"
                >
                  Aggiungi blocco manuale
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Giorni chiusi
              </h2>

              <div className="mt-6 space-y-3">
                {closedDays.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nessun giorno chiuso configurato.
                  </p>
                ) : (
                  closedDays.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                    >
                      <div>
                        <p className="font-bold text-slate-950">
                          {formatDateKey(item.date)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {item.reason ?? "Nessun motivo indicato"}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={deletingAvailabilityId === item.id}
                        onClick={() => setClosedDayPendingDeletion(item)}
                        className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Elimina
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                Blocchi manuali
              </h2>

              <div className="mt-6 space-y-3">
                {overrides.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nessun blocco manuale configurato.
                  </p>
                ) : (
                  overrides.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                    >
                      <div>
                        <p className="font-bold text-slate-950">
                          {formatDateKey(item.date)}
                        </p>
                        <p className="text-sm text-slate-600">
                          Box bloccati: {item.blocked_boxes}
                        </p>
                        <p className="text-sm text-slate-600">
                          Tipologia: {getBoxTypeLabel(item.box_type)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {item.reason ?? "Nessun motivo indicato"}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={deletingAvailabilityId === item.id}
                        onClick={() => setOverridePendingDeletion(item)}
                        className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Elimina
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ResponsiveDialog
        isOpen={closedDayPendingDeletion !== null}
        title="Eliminare il giorno chiuso?"
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        isConfirming={
          closedDayPendingDeletion !== null &&
          deletingAvailabilityId === closedDayPendingDeletion.id
        }
        tone="danger"
        onClose={() => setClosedDayPendingDeletion(null)}
        onConfirm={() => {
          if (closedDayPendingDeletion) {
            void deleteClosedDay(closedDayPendingDeletion.id);
          }
        }}
      >
        <p>
          Vuoi eliminare il giorno chiuso del{" "}
          <span className="font-bold text-slate-900">
            {closedDayPendingDeletion?.date}
          </span>
          ?
        </p>
      </ResponsiveDialog>

      <ResponsiveDialog
        isOpen={overridePendingDeletion !== null}
        title="Eliminare il blocco manuale?"
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        isConfirming={
          overridePendingDeletion !== null &&
          deletingAvailabilityId === overridePendingDeletion.id
        }
        tone="danger"
        onClose={() => setOverridePendingDeletion(null)}
        onConfirm={() => {
          if (overridePendingDeletion) {
            void deleteOverride(overridePendingDeletion.id);
          }
        }}
      >
        <p>
          Vuoi eliminare il blocco manuale del{" "}
          <span className="font-bold text-slate-900">
            {overridePendingDeletion?.date}
          </span>
          ?
        </p>
      </ResponsiveDialog>
    </section>
  );
}
