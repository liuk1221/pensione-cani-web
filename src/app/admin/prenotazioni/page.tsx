"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import { getBoxTypeLabel } from "@/lib/box-types";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

type BookingSource = "online" | "phone" | "admin";

type BookingDog = {
  id: string;
  name: string;
  breed: string | null;
  size: string;
  age: number | null;
  sex: string | null;
  sterilized: boolean | null;
};

type BookingDogLink = {
  position: number;
  dog: BookingDog | BookingDog[] | null;
};

type SelectedExtraService = {
  id: string;
  service: string;
  amountCents: number;
  billingUnit: string;
};

type Booking = {
  id: string;
  source: BookingSource;
  status: BookingStatus;
  stay_type: "day_care" | "overnight";
  start_date: string;
  end_date: string;
  expected_arrival_time: string | null;
  expected_pickup_time: string | null;
  box_type: string | null;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  box_count: number | null;
  estimated_price_cents: number | null;
  selected_extra_services: SelectedExtraService[] | null;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  dog: BookingDog;
  booking_dogs: BookingDogLink[] | null;
};

type BaseApiResponse = {
  error?: string;
  message?: string;
};

type BookingsResponse = BaseApiResponse & {
  bookings?: Booking[];
};

type ActionResponse = BaseApiResponse & {
  ok?: boolean;
  unavailableDays?: string[];
};

type StatusAction = {
  booking: Booking;
  status: Extract<BookingStatus, "confirmed" | "rejected" | "completed">;
};

const statusLabels: Record<BookingStatus, string> = {
  pending: "In attesa",
  confirmed: "Confermata",
  rejected: "Rifiutata",
  cancelled: "Annullata",
  completed: "Completata",
};

const sourceLabels: Record<BookingSource, string> = {
  online: "Online",
  phone: "Telefono",
  admin: "Admin",
};

const statusClasses: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-900",
  confirmed: "bg-green-100 text-green-900",
  rejected: "bg-red-100 text-red-900",
  cancelled: "bg-slate-100 text-slate-700",
  completed: "bg-blue-100 text-blue-900",
};

const customerMessageLabels: Record<StatusAction["status"], string> = {
  confirmed: "Informazioni dopo la conferma",
  rejected: "Motivo del rifiuto",
  completed: "Informazioni post completamento",
};

const statusActionDialogTitles: Record<StatusAction["status"], string> = {
  confirmed: "Confermare prenotazione",
  rejected: "Rifiutare prenotazione",
  completed: "Completare prenotazione",
};

const statusActionConfirmLabels: Record<StatusAction["status"], string> = {
  confirmed: "Conferma",
  rejected: "Rifiuta",
  completed: "Completa",
};

function formatDateKey(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function formatEuro(cents: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDateList(dates: string[]) {
  return dates.map(formatDateKey).join(", ");
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : "Non indicato";
}

function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getStayLabel(booking: Booking) {
  return booking.stay_type === "day_care"
    ? "Senza pernottamento"
    : "Con pernottamento";
}

function getSingleDog(dog: BookingDog | BookingDog[] | null) {
  return Array.isArray(dog) ? (dog[0] ?? null) : dog;
}

function getBookingDogs(booking: Booking) {
  const linkedDogs =
    booking.booking_dogs
      ?.map((link) => ({
        position: link.position,
        dog: getSingleDog(link.dog),
      }))
      .filter((link): link is { position: number; dog: BookingDog } =>
        Boolean(link.dog),
      )
      .sort((a, b) => a.position - b.position)
      .map((link) => link.dog) ?? [];

  return linkedDogs.length > 0 ? linkedDogs : [booking.dog];
}

function getBookingDogNames(booking: Booking) {
  return getBookingDogs(booking)
    .map((dog) => dog.name)
    .join(", ");
}

function getTodayDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isBookingActiveOnDate(booking: Booking, dateKey: string) {
  if (booking.status !== "confirmed") {
    return false;
  }

  if (booking.stay_type === "day_care") {
    return booking.start_date === dateKey;
  }

  return booking.start_date <= dateKey && booking.end_date >= dateKey;
}

async function readJsonResponse<T extends BaseApiResponse>(
  response: Response,
): Promise<T> {
  const text = await response.text();

  if (!text) {
    return {
      error: `Risposta vuota dal server. HTTP ${response.status}`,
    } as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return {
      error: `Risposta non JSON dal server. HTTP ${response.status}: ${text.slice(
        0,
        300,
      )}`,
    } as T;
  }
}

async function fetchBookings() {
  const response = await fetch("/api/admin/bookings", {
    cache: "no-store",
  });

  const payload = await readJsonResponse<BookingsResponse>(response);

  if (!response.ok) {
    throw new Error(
      payload.error ?? "Errore durante il caricamento prenotazioni.",
    );
  }

  return payload.bookings ?? [];
}

export default function AdminPrenotazioniPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [adminNotesById, setAdminNotesById] = useState<Record<string, string>>(
    {},
  );
  const [bookingDateEdits, setBookingDateEdits] = useState<
    Record<string, { startDate: string; endDate: string }>
  >({});

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">(
    "pending",
  );
  const [sourceFilter, setSourceFilter] = useState<BookingSource | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [activeTodayOnly, setActiveTodayOnly] = useState(false);
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availabilityWarning, setAvailabilityWarning] = useState<
    string[] | null
  >(null);
  const [pendingStatusAction, setPendingStatusAction] =
    useState<StatusAction | null>(null);
  const [customerMessage, setCustomerMessage] = useState("");
  const [bookingPendingDeletion, setBookingPendingDeletion] =
    useState<Booking | null>(null);

  const todayKey = getTodayDateKey();

  function applyBookings(nextBookings: Booking[]) {
    setBookings(nextBookings);
    setAdminNotesById(
      Object.fromEntries(
        nextBookings.map((booking) => [booking.id, booking.admin_notes ?? ""]),
      ),
    );
    setBookingDateEdits(
      Object.fromEntries(
        nextBookings.map((booking) => [
          booking.id,
          {
            startDate: booking.start_date,
            endDate: booking.end_date,
          },
        ]),
      ),
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialBookings() {
      try {
        const loadedBookings = await fetchBookings();

        if (!cancelled) {
          applyBookings(loadedBookings);
          setError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Errore durante il caricamento prenotazioni.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialBookings();

    return () => {
      cancelled = true;
    };
  }, []);

  async function reloadBookings(options: { clearMessages?: boolean } = {}) {
    const clearMessages = options.clearMessages ?? true;

    try {
      setIsRefreshing(true);
      setError(null);

      if (clearMessages) {
        setSuccessMessage(null);
      }

      const loadedBookings = await fetchBookings();
      applyBookings(loadedBookings);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Errore durante il caricamento prenotazioni.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function updateBookingStatus(
    id: string,
    status: BookingStatus,
    messageToCustomer = "",
  ) {
    const currentBooking = bookings.find((booking) => booking.id === id);

    if (!currentBooking) {
      return;
    }

    const dateEdit = bookingDateEdits[id] ?? {
      startDate: currentBooking.start_date,
      endDate: currentBooking.end_date,
    };

    if (
      status === "confirmed" &&
      (!isValidDateKey(dateEdit.startDate) || !isValidDateKey(dateEdit.endDate))
    ) {
      setError("Inserisci un intervallo di date valido prima di confermare.");
      return;
    }

    if (status === "confirmed" && dateEdit.endDate < dateEdit.startDate) {
      setError("La data di uscita non puo essere precedente all'arrivo.");
      return;
    }

    try {
      setUpdatingId(id);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          adminNotes: adminNotesById[id] ?? "",
          customerMessage: messageToCustomer,
          ...(status === "confirmed"
            ? {
                startDate: dateEdit.startDate,
                endDate: dateEdit.endDate,
              }
            : {}),
        }),
      });

      const payload = await readJsonResponse<ActionResponse>(response);

      if (!response.ok) {
        if (status === "confirmed" && payload.unavailableDays?.length) {
          setAvailabilityWarning(payload.unavailableDays);
        }

        throw new Error(
          payload.error ?? "Errore durante l’aggiornamento prenotazione.",
        );
      }

      await reloadBookings({ clearMessages: false });

      setSuccessMessage(
        `Prenotazione aggiornata: ${statusLabels[status].toLowerCase()}.`,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Errore durante l’aggiornamento prenotazione.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function saveAdminNotes(booking: Booking) {
    try {
      setUpdatingId(booking.id);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: booking.status,
          adminNotes: adminNotesById[booking.id] ?? "",
        }),
      });

      const payload = await readJsonResponse<ActionResponse>(response);

      if (!response.ok) {
        throw new Error(
          payload.error ?? "Errore durante il salvataggio delle note.",
        );
      }

      await reloadBookings({ clearMessages: false });

      setSuccessMessage("Note admin salvate correttamente.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Errore durante il salvataggio delle note.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function openStatusActionDialog(
    booking: Booking,
    status: StatusAction["status"],
  ) {
    setPendingStatusAction({ booking, status });
    setCustomerMessage("");
  }

  async function confirmPendingStatusAction() {
    if (!pendingStatusAction) {
      return;
    }

    const { booking, status } = pendingStatusAction;
    const message = customerMessage;

    setPendingStatusAction(null);
    setCustomerMessage("");

    await updateBookingStatus(booking.id, status, message);
  }

  async function deleteBooking(booking: Booking) {
    try {
      setBookingPendingDeletion(null);
      setUpdatingId(booking.id);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "DELETE",
      });

      const payload = await readJsonResponse<ActionResponse>(response);

      if (!response.ok) {
        throw new Error(
          payload.error ?? "Errore durante l’eliminazione prenotazione.",
        );
      }

      setBookings((current) =>
        current.filter((item) => item.id !== booking.id),
      );

      setAdminNotesById((current) => {
        const next = { ...current };
        delete next[booking.id];
        return next;
      });

      setSuccessMessage("Prenotazione eliminata definitivamente dal DB.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Errore durante l’eliminazione prenotazione.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function clearTextAndDateFilters() {
    setSearchQuery("");
    setFromDateFilter("");
    setToDateFilter("");
    setSourceFilter("all");
  }

  function showPendingBookings() {
    clearTextAndDateFilters();
    setStatusFilter("pending");
    setActiveTodayOnly(false);
  }

  function showConfirmedBookings() {
    clearTextAndDateFilters();
    setStatusFilter("confirmed");
    setActiveTodayOnly(false);
  }

  function showActiveTodayBookings() {
    clearTextAndDateFilters();
    setStatusFilter("confirmed");
    setActiveTodayOnly(true);
  }

  function showAllBookings() {
    setStatusFilter("all");
    setSourceFilter("all");
    setSearchQuery("");
    setFromDateFilter("");
    setToDateFilter("");
    setActiveTodayOnly(false);
  }

  function resetFilters() {
    showAllBookings();
  }

  const filteredBookings = useMemo(() => {
    const query = normalizeText(searchQuery);

    return bookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;

      const matchesSource =
        sourceFilter === "all" || booking.source === sourceFilter;

      const searchableText = normalizeText(
        [
          booking.customer.first_name,
          booking.customer.last_name,
          booking.customer.email,
          booking.customer.phone,
          getBookingDogNames(booking),
          ...getBookingDogs(booking).map((dog) => dog.breed ?? ""),
          booking.notes ?? "",
          booking.admin_notes ?? "",
        ].join(" "),
      );

      const matchesQuery = query.length === 0 || searchableText.includes(query);

      const matchesFromDate =
        !fromDateFilter || booking.start_date >= fromDateFilter;

      const matchesToDate = !toDateFilter || booking.start_date <= toDateFilter;

      const matchesActiveToday =
        !activeTodayOnly || isBookingActiveOnDate(booking, todayKey);

      return (
        matchesStatus &&
        matchesSource &&
        matchesQuery &&
        matchesFromDate &&
        matchesToDate &&
        matchesActiveToday
      );
    });
  }, [
    bookings,
    searchQuery,
    statusFilter,
    sourceFilter,
    fromDateFilter,
    toDateFilter,
    activeTodayOnly,
    todayKey,
  ]);

  const pendingCount = useMemo(
    () => bookings.filter((booking) => booking.status === "pending").length,
    [bookings],
  );

  const confirmedCount = useMemo(
    () => bookings.filter((booking) => booking.status === "confirmed").length,
    [bookings],
  );

  const activeTodayCount = useMemo(
    () =>
      bookings
        .filter((booking) => isBookingActiveOnDate(booking, todayKey))
        .reduce(
          (total, booking) => total + getBookingDogs(booking).length,
          0,
        ),
    [bookings, todayKey],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (statusFilter !== "all") {
      count++;
    }

    if (sourceFilter !== "all") {
      count++;
    }

    if (activeTodayOnly) {
      count++;
    }

    if (searchQuery.trim().length > 0) {
      count++;
    }

    if (fromDateFilter) {
      count++;
    }

    if (toDateFilter) {
      count++;
    }

    return count;
  }, [
    statusFilter,
    sourceFilter,
    activeTodayOnly,
    searchQuery,
    fromDateFilter,
    toDateFilter,
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
            Area admin
          </p>

          <h1 className="text-4xl font-bold text-slate-950">
            Gestione prenotazioni
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">
            Cerca, filtra, conferma, rifiuta o cancella le prenotazioni. Le
            prenotazioni confermate aggiornano automaticamente il calendario
            pubblico.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void reloadBookings()}
          disabled={isRefreshing}
          className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRefreshing ? "Aggiornamento..." : "Aggiorna lista"}
        </button>
      </div>

      <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Riepilogo rapido
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Stato prenotazioni
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Clicca su una card per filtrare automaticamente l’elenco
              sottostante.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={showPendingBookings}
            className={`rounded-3xl border p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
              statusFilter === "pending" && !activeTodayOnly
                ? "border-yellow-300 bg-yellow-50 ring-2 ring-yellow-200"
                : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-sm font-semibold text-slate-500">In attesa</p>
            <p className="mt-2 text-3xl font-bold text-yellow-700">
              {pendingCount}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Mostra richieste da gestire
            </p>
          </button>

          <button
            type="button"
            onClick={showConfirmedBookings}
            className={`rounded-3xl border p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
              statusFilter === "confirmed" && !activeTodayOnly
                ? "border-green-300 bg-green-50 ring-2 ring-green-200"
                : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-sm font-semibold text-slate-500">Confermate</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {confirmedCount}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Mostra prenotazioni confermate
            </p>
          </button>

          <button
            type="button"
            onClick={showActiveTodayBookings}
            className={`rounded-3xl border p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
              activeTodayOnly
                ? "border-blue-300 bg-blue-50 ring-2 ring-blue-200"
                : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-sm font-semibold text-slate-500">
              Oggi in struttura
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {activeTodayCount}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Mostra solo cani presenti oggi
            </p>
          </button>

          <button
            type="button"
            onClick={showAllBookings}
            className={`rounded-3xl border p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
              statusFilter === "all" && !activeTodayOnly
                ? "border-slate-400 bg-slate-50 ring-2 ring-slate-200"
                : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-sm font-semibold text-slate-500">Totali</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {bookings.length}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Mostra tutte le prenotazioni
            </p>
          </button>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setAreFiltersOpen((value) => !value)}
          className="flex w-full flex-col justify-between gap-4 p-6 text-left md:flex-row md:items-center"
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Filtri avanzati
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Ricerca e ordinamento lista
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Usa questi filtri per cercare una prenotazione specifica per nome,
              cane, telefono, email, stato, origine o data di arrivo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-800">
                {activeFilterCount} filtri attivi
              </span>
            )}

            <span className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700">
              {areFiltersOpen ? "Nascondi filtri" : "Mostra filtri"}
            </span>
          </div>
        </button>

        {areFiltersOpen && (
          <div className="border-t border-slate-200 p-6">
            <div className="grid gap-5 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label className="text-sm font-semibold text-slate-700">
                  Cerca
                </label>

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Nome, cane, email, telefono..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Stato
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(
                      event.target.value as BookingStatus | "all",
                    );
                    setActiveTodayOnly(false);
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">Tutti</option>
                  <option value="pending">In attesa</option>
                  <option value="confirmed">Confermate</option>
                  <option value="rejected">Rifiutate</option>
                  <option value="cancelled">Annullate</option>
                  <option value="completed">Completate</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Origine
                </label>

                <select
                  value={sourceFilter}
                  onChange={(event) =>
                    setSourceFilter(
                      event.target.value as BookingSource | "all",
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">Tutte</option>
                  <option value="online">Online</option>
                  <option value="phone">Telefono</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Reset filtri
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Arrivo da
                </label>

                <input
                  type="date"
                  value={fromDateFilter}
                  onChange={(event) => setFromDateFilter(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Arrivo fino a
                </label>

                <input
                  type="date"
                  value={toDateFilter}
                  onChange={(event) => setToDateFilter(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        )}
      </section>

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

      <section className="mt-10 border-t border-slate-300 pt-8">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Elenco prenotazioni
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              Prenotazioni filtrate
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Stai visualizzando {filteredBookings.length} prenotazioni su{" "}
              {bookings.length} totali.
            </p>
          </div>

          {activeTodayOnly && (
            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800">
              Filtro attivo: oggi in struttura
            </span>
          )}
        </div>
      </section>

      {isLoading ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
          Caricamento prenotazioni...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">
            Nessuna prenotazione trovata
          </h2>

          <p className="mt-3 text-sm text-slate-600">
            Non ci sono prenotazioni corrispondenti ai filtri selezionati.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-8">
          {filteredBookings.map((booking) => {
            const isExpanded = expandedId === booking.id;
            const isUpdating = updatingId === booking.id;
            const dateEdit = bookingDateEdits[booking.id] ?? {
              startDate: booking.start_date,
              endDate: booking.end_date,
            };
            const bookingDogs = getBookingDogs(booking);
            const bookingDogNames = getBookingDogNames(booking);

            return (
              <article
                key={booking.id}
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-950">
                      {bookingDogNames}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        statusClasses[booking.status]
                      }`}
                    >
                      {statusLabels[booking.status]}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {sourceLabels[booking.source]}
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                      {getStayLabel(booking)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Richiesta ricevuta il {formatDateTime(booking.created_at)}
                  </p>

                    <div>
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                            className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                            {isExpanded ? "Chiudi dettagli" : "Dettagli"}
                            </button>

                            {booking.status === "pending" ? (
                            <>
                                <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => openStatusActionDialog(booking, "confirmed")}
                                className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-green-200 bg-green-50 px-5 py-2 text-sm font-bold text-green-800 transition hover:border-green-300 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                Conferma
                                </button>

                                <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => openStatusActionDialog(booking, "rejected")}
                                className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                Rifiuta
                                </button>
                            </>
                            ) : booking.status === "confirmed" ? (
                            <>
                                <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => openStatusActionDialog(booking, "completed")}
                                className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-bold text-blue-800 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                Completa
                                </button>

                                <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => void updateBookingStatus(booking.id, "cancelled")}
                                className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                Annulla
                                </button>
                            </>
                            ) : (
                            <span className="inline-flex min-h-[42px] items-center justify-center rounded-full bg-slate-100 px-5 py-2 text-sm font-bold text-slate-500">
                                Nessuna azione disponibile
                            </span>
                            )}

                            <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => setBookingPendingDeletion(booking)}
                            className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                            Elimina dal DB
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-700">
                      Permanenza
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      Arrivo: {formatDateKey(booking.start_date)}
                    </p>

                    <p className="text-sm text-slate-600">
                      Uscita: {formatDateKey(booking.end_date)}
                    </p>

                    <p className="mt-3 text-sm text-slate-600">
                      Orario arrivo: {formatTime(booking.expected_arrival_time)}
                    </p>

                    <p className="text-sm text-slate-600">
                      Orario ritiro: {formatTime(booking.expected_pickup_time)}
                    </p>

                    <p className="mt-3 text-sm text-slate-600">
                      Box: {getBoxTypeLabel(booking.box_type)}
                    </p>

                    {booking.status === "pending" ? (
                      <div className="mt-4 grid gap-3">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Nuovo arrivo
                          </label>

                          <input
                            type="date"
                            value={dateEdit.startDate}
                            onChange={(event) =>
                              setBookingDateEdits((current) => ({
                                ...current,
                                [booking.id]: {
                                  ...dateEdit,
                                  startDate: event.target.value,
                                },
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Nuova uscita
                          </label>

                          <input
                            type="date"
                            value={dateEdit.endDate}
                            min={dateEdit.startDate}
                            onChange={(event) =>
                              setBookingDateEdits((current) => ({
                                ...current,
                                [booking.id]: {
                                  ...dateEdit,
                                  endDate: event.target.value,
                                },
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-700">
                      Proprietario
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      {booking.customer.first_name} {booking.customer.last_name}
                    </p>

                    <p className="text-sm text-slate-600">
                      {booking.customer.phone || "Telefono non indicato"}
                    </p>

                    <p className="text-sm text-slate-600">
                      {booking.customer.email || "Email non indicata"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-700">
                      {bookingDogs.length === 1 ? "Cane" : "Cani"}
                    </p>

                    <div className="mt-2 space-y-3">
                      {bookingDogs.map((dog, index) => (
                        <div key={dog.id} className="text-sm text-slate-600">
                          <p className="font-semibold text-slate-800">
                            {index + 1}. {dog.name}
                          </p>
                          <p>Razza: {dog.breed ?? "Non specificata"}</p>
                          <p>Taglia: {dog.size}</p>
                          <p>Eta: {dog.age ?? "Non specificata"}</p>
                        </div>
                      ))}
                    </div>

                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      Box prenotazione: 1
                    </p>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {(booking.estimated_price_cents !== null ||
                      (booking.selected_extra_services?.length ?? 0) > 0) && (
                      <div className="rounded-2xl bg-green-50 p-4 text-sm text-green-950">
                        <p className="font-bold">Preventivo</p>

                        <p className="mt-2 text-2xl font-bold">
                          {booking.estimated_price_cents !== null
                            ? formatEuro(booking.estimated_price_cents)
                            : "Non calcolato"}
                        </p>

                        <p className="mt-3 font-semibold">Servizi extra</p>
                        <p className="mt-1 leading-6">
                          {booking.selected_extra_services?.length
                            ? booking.selected_extra_services
                                .map((service) => service.service)
                                .join(", ")
                            : "Nessun servizio extra selezionato."}
                        </p>
                      </div>
                    )}

                    <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-950">
                      <p className="font-bold">Note cliente</p>

                      <p className="mt-2 leading-6">
                        {booking.notes ?? "Nessuna nota cliente."}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-950">
                      <label className="font-bold">Note admin</label>

                      <textarea
                        value={adminNotesById[booking.id] ?? ""}
                        onChange={(event) =>
                          setAdminNotesById((current) => ({
                            ...current,
                            [booking.id]: event.target.value,
                          }))
                        }
                        rows={5}
                        placeholder="Note interne non visibili al cliente..."
                        className="mt-3 w-full rounded-2xl border border-yellow-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100"
                      />

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => void saveAdminNotes(booking)}
                        className="mt-3 rounded-full bg-yellow-400 px-5 py-2 text-sm font-bold text-blue-950 transition hover:bg-yellow-300 disabled:opacity-50"
                      >
                        Salva note
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ResponsiveDialog
        isOpen={availabilityWarning !== null}
        title="Impossibile confermare"
        confirmLabel="Ho capito"
        cancelLabel="Chiudi"
        onClose={() => setAvailabilityWarning(null)}
      >
        <p>
          Nei giorni indicati non c&apos;e disponibilita:{" "}
          <span className="font-bold text-slate-900">
            {availabilityWarning ? formatDateList(availabilityWarning) : ""}
          </span>
          .
        </p>
        <p className="mt-3">
          La prenotazione resta tra le richieste in attesa.
        </p>
      </ResponsiveDialog>

      <ResponsiveDialog
        isOpen={pendingStatusAction !== null}
        title={
          pendingStatusAction
            ? statusActionDialogTitles[pendingStatusAction.status]
            : "Aggiorna prenotazione"
        }
        confirmLabel={
          pendingStatusAction
            ? statusActionConfirmLabels[pendingStatusAction.status]
            : "Conferma"
        }
        cancelLabel="Annulla"
        tone={pendingStatusAction?.status === "rejected" ? "danger" : "default"}
        onClose={() => {
          setPendingStatusAction(null);
          setCustomerMessage("");
        }}
        onConfirm={() => {
          void confirmPendingStatusAction();
        }}
      >
        <p>
          {pendingStatusAction
            ? `Vuoi segnare la prenotazione di ${getBookingDogNames(
                pendingStatusAction.booking,
              )} come ${statusLabels[pendingStatusAction.status].toLowerCase()}?`
            : ""}
        </p>

        <label className="mt-5 block text-sm font-bold text-slate-800">
          {pendingStatusAction
            ? customerMessageLabels[pendingStatusAction.status]
            : "Messaggio al cliente"}
        </label>

        <textarea
          value={customerMessage}
          onChange={(event) => setCustomerMessage(event.target.value)}
          rows={5}
          placeholder="Testo opzionale da inserire nell'email al cliente..."
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        isOpen={bookingPendingDeletion !== null}
        title="Eliminare la prenotazione?"
        confirmLabel="Elimina definitivamente"
        cancelLabel="Annulla"
        isConfirming={
          bookingPendingDeletion !== null &&
          updatingId === bookingPendingDeletion.id
        }
        tone="danger"
        onClose={() => setBookingPendingDeletion(null)}
        onConfirm={() => {
          if (bookingPendingDeletion) {
            void deleteBooking(bookingPendingDeletion);
          }
        }}
      >
        <p>
          Vuoi eliminare definitivamente la prenotazione di{" "}
          <span className="font-bold text-slate-900">
            {bookingPendingDeletion
              ? getBookingDogNames(bookingPendingDeletion)
              : ""}
          </span>
          ?
        </p>
        <p className="mt-3 font-semibold text-red-700">
          Questa azione non puo essere annullata.
        </p>
      </ResponsiveDialog>
    </section>
  );
}
