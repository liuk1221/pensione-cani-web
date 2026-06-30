"use client";

import { FormEvent, useMemo, useState } from "react";
import { formatDateKey } from "@/lib/date-utils";
import {
  bookingPricing,
  selectableExtraServices,
  type DogSize,
} from "@/lib/listino-config";
import { calculateBookingEstimate, formatEuro } from "@/lib/pricing";

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

type DogForm = {
  id: number;
  size: DogSize | "";
};

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
  const [dogs, setDogs] = useState<DogForm[]>([{ id: 1, size: "" }]);
  const [areExtraServicesOpen, setAreExtraServicesOpen] = useState(false);
  const [selectedExtraServiceIds, setSelectedExtraServiceIds] = useState<
    string[]
  >([]);
  const [expectedPickupTime, setExpectedPickupTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const estimate = useMemo(
    () =>
      calculateBookingEstimate({
        startDate,
        endDate,
        dogs,
        extraServiceIds: selectedExtraServiceIds,
        expectedPickupTime,
      }),
    [dogs, endDate, expectedPickupTime, selectedExtraServiceIds, startDate],
  );

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

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payloadDogs = dogs.map((dog) => readDogFromForm(formData, dog));

    if (
      payloadDogs.length === 0 ||
      payloadDogs.some((dog) => !dog.name.trim() || !dog.size)
    ) {
      setError("Inserisci nome e taglia per ogni cane.");
      setSuccessMessage(null);
      return;
    }

    if (!expectedPickupTime) {
      setError("Inserisci l'orario previsto di ritiro.");
      setSuccessMessage(null);
      return;
    }

    const payload = {
      source: String(formData.get("source") ?? "phone"),
      status: String(formData.get("status") ?? "confirmed"),

      startDate,
      endDate,

      ownerName: String(formData.get("ownerName") ?? ""),
      ownerSurname: String(formData.get("ownerSurname") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      expectedArrivalTime: String(formData.get("expectedArrivalTime") ?? ""),
      expectedPickupTime,
      boxType: String(formData.get("boxType") ?? ""),

      dogs: payloadDogs,
      extraServiceIds: selectedExtraServiceIds,

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
            `Errore durante l'inserimento della prenotazione. HTTP ${response.status}`,
        );
      }

      form.reset();
      setDogs([{ id: 1, size: "" }]);
      setSelectedExtraServiceIds([]);
      setExpectedPickupTime("");
      setAreExtraServicesOpen(false);

      setSuccessMessage(
        result.message ?? "Prenotazione inserita correttamente.",
      );

      await onCreated();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Errore durante l'inserimento della prenotazione.",
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
          email o direttamente in struttura. La prenotazione puo essere salvata
          gia come confermata.
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
            <Field label="Telefono" name="phone" type="tel" inputMode="tel" />
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Email e telefono sono facoltativi per le prenotazioni inserite
            manualmente dall&apos;admin.
          </p>
        </div>

        <div className="rounded-3xl bg-slate-50 p-5">
          <h3 className="text-lg font-bold text-slate-950">
            Orari previsti
          </h3>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <Field
              label="Orario previsto di arrivo"
              name="expectedArrivalTime"
              type="time"
            />
            <Field
              label="Orario previsto di ritiro"
              name="expectedPickupTime"
              type="time"
              required
              value={expectedPickupTime}
              onChange={setExpectedPickupTime}
            />
            <SelectField
              label="Tipologia box"
              name="boxType"
              defaultValue=""
              options={[
                ["", "Nessuna preferenza"],
                ["outdoor", "Box esterno"],
                ["indoor", "Box interno"],
              ]}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-slate-50 p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Dati cani</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Una prenotazione occupa sempre un solo box. Puoi inserire fino a{" "}
                {bookingPricing.maxDogsPerBooking} cani compatibili dello
                stesso nucleo.
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
              <div key={dog.id} className="rounded-2xl bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-bold text-slate-950">
                    Cane {index + 1}
                  </h4>

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

                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  <Field
                    label="Nome cane"
                    name={`dogName-${dog.id}`}
                    required
                  />
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

        <div className="rounded-3xl bg-slate-50 p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-950">
                Servizi aggiuntivi
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Seleziona gli stessi servizi disponibili nel form pubblico.
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
              {selectableExtraServices.map((service) => {
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

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Note prenotazione
            </label>

            {/* Limita le note anche lato browser per un feedback immediato. */}
            <textarea
              name="notes"
              rows={5}
              maxLength={2000}
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
              maxLength={2000}
              placeholder="Note interne non visibili al cliente..."
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <EstimatePanel estimate={estimate} />

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
          {estimate.dogCount === 0
            ? "Inserisci almeno un cane per completare il preventivo."
            : "Inserisci l'orario previsto di ritiro per completare il preventivo."}
        </p>
      ) : (
        <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <EstimateRow
            label="Pensione"
            value={formatEuro(estimate.baseBeforeDiscountsCents)}
          />
          {estimate.overnightUnitRateCents !== null ? (
            <EstimateRow
              label={`Tariffa notturna ${estimate.overnightRateLabel}`}
              value={`${formatEuro(estimate.overnightUnitRateCents)} / notte`}
            />
          ) : null}
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
        </div>
      )}

      {estimate.selectedExtras.length > 0 ? (
        <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-700">
          <p className="font-bold text-slate-950">Servizi calcolati</p>
          <ul className="mt-2 space-y-1">
            {estimate.selectedExtras.map((service) => (
              <li key={service.id} className="flex justify-between gap-3">
                <span>{service.service}</span>
                <span className="font-bold text-blue-950">
                  {formatEuro(service.totalCents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {estimate.hasMinimumPriceServices ? (
        <p className="mt-4 text-xs leading-5 text-slate-600">
          Alcuni servizi indicano una tariffa &quot;da&quot;: il preventivo usa
          il valore minimo e sara confermato dalla struttura.
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

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  min?: string;
  inputMode?: "tel";
  value?: string;
  onChange?: (value: string) => void;
};

function Field({
  label,
  name,
  type = "text",
  required = false,
  min,
  inputMode,
  value,
  onChange,
}: FieldProps) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>

      <input
        name={name}
        type={type}
        required={required}
        min={min}
        inputMode={inputMode}
        value={value}
        onChange={
          onChange
            ? (event) => onChange(event.currentTarget.value)
            : undefined
        }
        maxLength={
          type === "email" ? 254 : type === "tel" ? 30 : type === "text" ? 100 : undefined
        }
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
