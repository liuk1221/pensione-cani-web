"use client";

import { FormEvent, useState } from "react";
import { formatDateKey } from "@/lib/date-utils";

type ManualBookingFormProps = {
  startDate: string;
  endDate: string;
  stayLabel: string;
  onCreated: () => void | Promise<void>;
};

type ApiResponse = {
  error?: string;
  message?: string;
};

async function readJsonResponse(response: Response): Promise<ApiResponse> {
  const text = await response.text();

  if (!text) {
    return {
      error: `Risposta vuota dal server. HTTP ${response.status}`,
    };
  }

  try {
    return JSON.parse(text) as ApiResponse;
  } catch {
    return {
      error: `Risposta non JSON dal server. HTTP ${response.status}: ${text.slice(
        0,
        300,
      )}`,
    };
  }
}

export function ManualBookingForm({
  startDate,
  endDate,
  stayLabel,
  onCreated,
}: ManualBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      source: String(formData.get("source") ?? "phone"),
      status: String(formData.get("status") ?? "confirmed"),

      startDate,
      endDate,

      ownerName: String(formData.get("ownerName") ?? ""),
      ownerSurname: String(formData.get("ownerSurname") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),

      dogName: String(formData.get("dogName") ?? ""),
      dogBreed: String(formData.get("dogBreed") ?? ""),
      dogSize: String(formData.get("dogSize") ?? ""),
      dogAge: String(formData.get("dogAge") ?? ""),
      dogSex: String(formData.get("dogSex") ?? ""),
      dogSterilized: String(formData.get("dogSterilized") ?? ""),

      notes: String(formData.get("notes") ?? ""),
      adminNotes: String(formData.get("adminNotes") ?? ""),
    };

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await readJsonResponse(response);

        if (!response.ok) {
        throw new Error(
            result.error ??
            `Errore durante l’inserimento della prenotazione. HTTP ${response.status}`,
        );
        }

      form.reset();

      setSuccessMessage(
        result.message ?? "Prenotazione inserita correttamente.",
      );

      await onCreated();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Errore durante l’inserimento della prenotazione.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
          Nuova prenotazione
        </p>

        <h2 className="text-2xl font-bold text-slate-950">
          Inserisci prenotazione manuale
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Usa questo form per prenotazioni ricevute via telefono, WhatsApp,
          email o direttamente in struttura. La prenotazione può essere salvata
          già come confermata.
        </p>
      </div>

      <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm text-blue-950">
        <p className="font-bold">Date selezionate</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="font-semibold">Arrivo</p>
            <p>{formatDateKey(startDate)}</p>
          </div>

          <div>
            <p className="font-semibold">Uscita</p>
            <p>{formatDateKey(endDate)}</p>
          </div>

          <div>
            <p className="font-semibold">Permanenza</p>
            <p>{stayLabel}</p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Origine
            </label>

            <select
              name="source"
              defaultValue="phone"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            >
              <option value="phone">Telefono / WhatsApp</option>
              <option value="admin">Admin / Di persona</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Stato iniziale
            </label>

            <select
              name="status"
              defaultValue="confirmed"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            >
              <option value="confirmed">Confermata</option>
              <option value="pending">In attesa</option>
            </select>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-50 p-5">
          <h3 className="text-lg font-bold text-slate-950">
            Dati proprietario
          </h3>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field label="Nome" name="ownerName" required />
            <Field label="Cognome" name="ownerSurname" required />
            <Field label="Email" name="email" type="email" />
            <Field label="Telefono" name="phone" type="tel" />
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Email e telefono sono facoltativi per le prenotazioni inserite
            manualmente dall’admin.
          </p>
        </div>

        <div className="rounded-3xl bg-slate-50 p-5">
          <h3 className="text-lg font-bold text-slate-950">Dati cane</h3>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <Field label="Nome cane" name="dogName" required />
            <Field label="Razza" name="dogBreed" />
            <Field label="Età" name="dogAge" type="number" min="0" />

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Taglia
              </label>

              <select
                name="dogSize"
                defaultValue=""
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="" disabled>
                  Seleziona taglia
                </option>
                <option value="small">Piccola</option>
                <option value="medium">Media</option>
                <option value="large">Grande</option>
                <option value="giant">Gigante</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Sesso
              </label>

              <select
                name="dogSex"
                defaultValue="unknown"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="unknown">Non specificato</option>
                <option value="male">Maschio</option>
                <option value="female">Femmina</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Sterilizzato/a
              </label>

              <select
                name="dogSterilized"
                defaultValue="unknown"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="unknown">Non specificato</option>
                <option value="yes">Sì</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Note prenotazione
            </label>

            <textarea
              name="notes"
              rows={5}
              placeholder="Richieste del cliente, esigenze del cane, alimentazione..."
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Note interne admin
            </label>

            <textarea
              name="adminNotes"
              rows={5}
              placeholder="Note interne non visibili al cliente..."
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-yellow-400 px-6 py-4 text-sm font-bold text-blue-950 shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Inserimento in corso..." : "Inserisci prenotazione"}
        </button>
      </form>
    </div>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  min?: string;
};

function Field({
  label,
  name,
  type = "text",
  required = false,
  min,
}: FieldProps) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>

      <input
        name={name}
        type={type}
        required={required}
        min={min}
        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}
