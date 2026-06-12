"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateKey } from "@/lib/date-utils";
import {
  bookingPricing,
  extraServices,
  type DogSize,
} from "@/lib/listino-config";
import { calculateBookingEstimate, formatEuro } from "@/lib/pricing";

type BookingRequestFormProps = {
  startDate: string | null;
  endDate: string | null;
  stayLabel: string;
};

type DogForm = {
  id: number;
  size: DogSize | "";
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

function readDogFromForm(formData: FormData, dog: DogForm) {
  return {
    name: String(formData.get(`dogName-${dog.id}`) ?? ""),
    breed: String(formData.get(`dogBreed-${dog.id}`) ?? ""),
    size: String(formData.get(`dogSize-${dog.id}`) ?? ""),
    age: String(formData.get(`dogAge-${dog.id}`) ?? ""),
    sex: String(formData.get(`dogSex-${dog.id}`) ?? ""),
    sterilized: String(formData.get(`dogSterilized-${dog.id}`) ?? ""),
  };
}

export function BookingRequestForm({
  startDate,
  endDate,
  stayLabel,
}: BookingRequestFormProps) {
  const router = useRouter();

  const [dogs, setDogs] = useState<DogForm[]>([{ id: 1, size: "" }]);
  const [areExtraServicesOpen, setAreExtraServicesOpen] = useState(false);
  const [selectedExtraServiceIds, setSelectedExtraServiceIds] = useState<
    string[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = Boolean(startDate && endDate && !isSubmitting);
  const estimate = useMemo(() => {
    if (!startDate || !endDate) {
      return null;
    }

    return calculateBookingEstimate({
      startDate,
      endDate,
      dogs,
      extraServiceIds: selectedExtraServiceIds,
    });
  }, [dogs, endDate, selectedExtraServiceIds, startDate]);

  function addDog() {
    setDogs((current) => {
      if (current.length >= bookingPricing.maxDogsPerBooking) {
        return current;
      }

      const nextId = Math.max(...current.map((dog) => dog.id)) + 1;

      return [...current, { id: nextId, size: "" }];
    });
  }

  function removeDog(id: number) {
    setDogs((current) =>
      current.length === 1 ? current : current.filter((dog) => dog.id !== id),
    );
  }

  function setDogSize(id: number, size: DogSize | "") {
    setDogs((current) =>
      current.map((dog) => (dog.id === id ? { ...dog, size } : dog)),
    );
  }

  function toggleExtraService(id: string) {
    setSelectedExtraServiceIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!startDate || !endDate) {
      setSubmitError("Seleziona prima arrivo e uscita.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData(event.currentTarget);
    const payloadDogs = dogs.map((dog) => readDogFromForm(formData, dog));

    const payload = {
      startDate,
      endDate,
      stayLabel,
      ownerName: String(formData.get("ownerName") ?? ""),
      ownerSurname: String(formData.get("ownerSurname") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      dogs: payloadDogs,
      extraServiceIds: selectedExtraServiceIds,
      notes: String(formData.get("notes") ?? ""),
    };

    if (!isValidPhoneNumber(payload.phone)) {
      setSubmitError("Inserisci un numero di telefono valido.");
      setIsSubmitting(false);
      return;
    }

    if (
      payloadDogs.length === 0 ||
      payloadDogs.some((dog) => !dog.name.trim() || !dog.size)
    ) {
      setSubmitError("Inserisci nome e taglia per ogni cane.");
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
          result.error ?? "Errore durante l'invio della richiesta.",
        );
      }

      router.push("/prenotazioni/conferma");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Errore durante l'invio della richiesta.",
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
          <SummaryItem
            label="Arrivo"
            value={startDate ? formatDateKey(startDate) : "Non selezionato"}
          />
          <SummaryItem
            label="Uscita"
            value={endDate ? formatDateKey(endDate) : "Non selezionato"}
          />
          <SummaryItem label="Tipo permanenza" value={stayLabel} />
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
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Dati cani</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Massimo {bookingPricing.maxDogsPerBox} cani nello stesso box.
            </p>
          </div>

          <button
            type="button"
            onClick={addDog}
            disabled={dogs.length >= bookingPricing.maxDogsPerBooking}
            className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Aggiungi cane
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {dogs.map((dog, index) => (
            <div key={dog.id} className="rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-slate-950">
                  Cane {index + 1}
                </h3>

                {dogs.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeDog(dog.id)}
                    className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50"
                  >
                    Rimuovi
                  </button>
                ) : null}
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Nome cane" name={`dogName-${dog.id}`} required />
                <Field label="Razza" name={`dogBreed-${dog.id}`} />
                <Field
                  label="Eta"
                  name={`dogAge-${dog.id}`}
                  type="number"
                  min="0"
                />

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Taglia
                  </label>
                  <select
                    name={`dogSize-${dog.id}`}
                    value={dog.size}
                    onChange={(event) =>
                      setDogSize(dog.id, event.target.value as DogSize | "")
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
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

                <SelectField
                  label="Sesso"
                  name={`dogSex-${dog.id}`}
                  defaultValue="unknown"
                  options={[
                    ["unknown", "Non specificato"],
                    ["male", "Maschio"],
                    ["female", "Femmina"],
                  ]}
                />

                <SelectField
                  label="Sterilizzato/a"
                  name={`dogSterilized-${dog.id}`}
                  defaultValue="unknown"
                  options={[
                    ["unknown", "Non specificato"],
                    ["yes", "Si"],
                    ["no", "No"],
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Servizi aggiuntivi
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Seleziona solo i servizi che desideri richiedere.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAreExtraServicesOpen((current) => !current)}
            className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            {areExtraServicesOpen ? "Nascondi servizi" : "Mostra servizi"}
          </button>
        </div>

        {areExtraServicesOpen ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {extraServices.map((service) => {
              const id = service.id ?? service.service;
              const isChecked = selectedExtraServiceIds.includes(id);

              return (
                <label
                  key={id}
                  className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
                    isChecked
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleExtraService(id)}
                    className="mt-1 h-4 w-4"
                  />

                  <span>
                    <span className="block text-sm font-bold text-slate-950">
                      {service.service}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">
                      {service.details}
                    </span>
                    <span className="mt-2 block text-sm font-bold text-blue-900">
                      {service.price}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        ) : null}
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
            placeholder="Carattere, abitudini, farmaci, alimentazione, esigenze particolari..."
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      {submitError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {submitError}
        </div>
      )}

      {estimate ? <EstimatePanel estimate={estimate} /> : null}

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

function EstimatePanel({
  estimate,
}: {
  estimate: ReturnType<typeof calculateBookingEstimate>;
}) {
  const stayUnit = estimate.stayType === "day_care" ? "giorno" : "notte";

  return (
    <div className="rounded-3xl border border-yellow-300 bg-yellow-50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-800">
            Preventivo stimato
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Calcolo su {estimate.dogCount}{" "}
            {estimate.dogCount === 1 ? "cane" : "cani"} e {estimate.quantity}{" "}
            {estimate.quantity === 1 ? stayUnit : `${stayUnit}/i`}.
          </p>
        </div>

        <p className="text-3xl font-bold text-blue-950">
          {estimate.isComplete ? formatEuro(estimate.totalCents) : "-"}
        </p>
      </div>

      {!estimate.isComplete ? (
        <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-semibold text-slate-700">
          Seleziona la taglia di ogni cane per completare il preventivo.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <EstimateRow
            label="Pensione"
            value={formatEuro(estimate.baseSubtotalCents)}
          />
          <EstimateRow
            label="Servizi extra"
            value={formatEuro(estimate.extrasSubtotalCents)}
          />
          {estimate.secondDogDiscountCents > 0 ? (
            <EstimateRow
              label={`Sconto secondo cane ${bookingPricing.secondDogDiscountPercent}%`}
              value={`-${formatEuro(estimate.secondDogDiscountCents)}`}
            />
          ) : null}
          {estimate.longStayDiscountCents > 0 ? (
            <EstimateRow
              label={`Sconto soggiorno lungo ${bookingPricing.longStayDiscountPercent}%`}
              value={`-${formatEuro(estimate.longStayDiscountCents)}`}
            />
          ) : null}
        </div>
      )}

      {estimate.hasMinimumPriceServices ? (
        <p className="mt-4 text-xs leading-5 text-slate-600">
          Alcuni servizi indicano una tariffa &quot;da&quot;: il preventivo usa il valore
          minimo e sara confermato dalla struttura.
        </p>
      ) : null}
    </div>
  );
}

function EstimateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
      <span className="font-semibold">{label}</span>
      <span className="font-bold text-blue-950">{value}</span>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-slate-500">{value}</p>
    </div>
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

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<[string, string]>;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
