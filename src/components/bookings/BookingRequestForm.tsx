"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type BookingRequestFormProps = {
  startDate: string | null;
  endDate: string | null;
  stayLabel: string;
};

const phoneInputPattern = "\\+?[0-9\\s().-]{7,20}";

function isValidPhoneNumber(value: string) {
  const phone = value.trim();
  const digits = phone.replace(/\D/g, "");

  return (
    digits.length >= 7 &&
    digits.length <= 15 &&
    /^\+?[0-9\s().-]+$/.test(phone)
  );
}

export function BookingRequestForm({
  startDate,
  endDate,
  stayLabel,
}: BookingRequestFormProps) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = Boolean(startDate && endDate && !isSubmitting);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!startDate || !endDate) {
      setSubmitError("Seleziona prima arrivo e uscita.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData(event.currentTarget);

    const payload = {
      startDate,
      endDate,
      stayLabel,
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
    };

    if (!isValidPhoneNumber(payload.phone)) {
      setSubmitError("Inserisci un numero di telefono valido.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        bookingId?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error ?? "Errore durante l’invio della richiesta.",
        );
      }

      router.push("/prenotazioni/conferma");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Errore durante l’invio della richiesta.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">
          Riepilogo permanenza
        </h2>

        <div className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="font-semibold text-slate-700">Arrivo</p>
            <p className="mt-1 text-slate-500">
              {startDate ?? "Non selezionato"}
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-700">Uscita</p>
            <p className="mt-1 text-slate-500">
              {endDate ?? "Non selezionato"}
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-700">Tipo permanenza</p>
            <p className="mt-1 text-slate-500">{stayLabel}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">
          Dati proprietario
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Nome" name="ownerName" required />
          <Field label="Cognome" name="ownerSurname" required />
          <Field label="Email" name="email" type="email" required />
          <Field
            label="Telefono"
            name="phone"
            type="tel"
            inputMode="tel"
            pattern={phoneInputPattern}
            title="Inserisci un numero di telefono valido."
            required
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Dati cane</h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Nome cane" name="dogName" required />
          <Field label="Razza" name="dogBreed" />
          <Field label="Età" name="dogAge" type="number" min="0" />

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Taglia
            </label>
            <select
              name="dogSize"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              defaultValue=""
              required
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
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              defaultValue=""
            >
              <option value="" disabled>
                Seleziona
              </option>
              <option value="male">Maschio</option>
              <option value="female">Femmina</option>
              <option value="unknown">Non specificato</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Sterilizzato/a
            </label>
            <select
              name="dogSterilized"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              defaultValue=""
            >
              <option value="" disabled>
                Seleziona
              </option>
              <option value="yes">Sì</option>
              <option value="no">No</option>
              <option value="unknown">Non specificato</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">
          Note e informazioni utili
        </h2>

        <div className="mt-6">
          <label className="text-sm font-semibold text-slate-700">
            Note sulla permanenza
          </label>
          <textarea
            name="notes"
            rows={5}
            placeholder="Carattere del cane, abitudini, farmaci, alimentazione, esigenze particolari..."
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      {submitError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-full bg-yellow-400 px-6 py-4 text-sm font-bold text-blue-950 shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "Invio richiesta in corso..."
          : "Invia richiesta di prenotazione"}
      </button>

      {!startDate || !endDate ? (
        <p className="text-center text-sm text-slate-500">
          Seleziona prima arrivo e uscita dal calendario.
        </p>
      ) : null}
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  min?: string;
  pattern?: string;
  inputMode?: "tel";
  title?: string;
};

function Field({
  label,
  name,
  type = "text",
  required = false,
  min,
  pattern,
  inputMode,
  title,
}: FieldProps) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        min={min}
        pattern={pattern}
        inputMode={inputMode}
        title={title}
        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}
