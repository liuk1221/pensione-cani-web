import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ConfirmedBooking = {
  stay_type: "day_care" | "overnight";
  start_date: string;
  end_date: string;
};

function getTodayDateKey() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isBookingActiveToday(booking: ConfirmedBooking, todayKey: string) {
  if (booking.stay_type === "day_care") {
    return booking.start_date === todayKey;
  }

  return booking.start_date <= todayKey && booking.end_date > todayKey;
}

async function getAdminDashboardData() {
  const todayKey = getTodayDateKey();

  const [
    pendingResponse,
    confirmedResponse,
    totalResponse,
    confirmedBookingsResponse,
    settingsResponse,
  ] = await Promise.all([
    supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),

    supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed"),

    supabaseAdmin.from("bookings").select("id", { count: "exact", head: true }),

    supabaseAdmin
      .from("bookings")
      .select("stay_type, start_date, end_date")
      .eq("status", "confirmed"),

    supabaseAdmin
      .from("app_settings")
      .select("total_boxes")
      .eq("id", 1)
      .single(),
  ]);

  const errors = [
    pendingResponse.error,
    confirmedResponse.error,
    totalResponse.error,
    confirmedBookingsResponse.error,
    settingsResponse.error,
  ].filter(Boolean);

  const confirmedBookings = (confirmedBookingsResponse.data ?? []) as ConfirmedBooking[];

  const activeTodayCount = confirmedBookings.filter((booking) =>
    isBookingActiveToday(booking, todayKey),
  ).length;

  return {
    pendingCount: pendingResponse.count ?? 0,
    confirmedCount: confirmedResponse.count ?? 0,
    totalCount: totalResponse.count ?? 0,
    activeTodayCount,
    totalBoxes: settingsResponse.data?.total_boxes ?? 0,
    hasError: errors.length > 0,
  };
}

export default async function AdminPage() {
  const {
    pendingCount,
    confirmedCount,
    totalCount,
    activeTodayCount,
    totalBoxes,
    hasError,
  } = await getAdminDashboardData();

  const recapItems = [
    {
      label: "In attesa",
      value: pendingCount,
      description: "Richieste da gestire",
      valueClassName: "text-yellow-700",
    },
    {
      label: "Confermate",
      value: confirmedCount,
      description: "Prenotazioni confermate",
      valueClassName: "text-green-700",
    },
    {
      label: "Oggi in struttura",
      value: activeTodayCount,
      description: "Cani presenti oggi",
      valueClassName: "text-blue-900",
    },
    {
      label: "Totali",
      value: totalCount,
      description: "Tutte le prenotazioni",
      valueClassName: "text-slate-950",
    },
    {
      label: "Box totali",
      value: totalBoxes,
      description: "Disponibilità base",
      valueClassName: "text-slate-950",
    },
  ];

  const quickActions = [
    {
      title: "Prenotazioni",
      description: "Conferma, rifiuta, annulla o elimina le richieste ricevute.",
      href: "/admin/prenotazioni",
      button: "Apri sezione",
    },
    {
      title: "Calendario",
      description: "Controlla la disponibilità reale e inserisci prenotazioni manuali.",
      href: "/admin/calendario",
      button: "Vai al calendario",
    },
    {
      title: "Disponibilità",
      description: "Blocca giorni, gestisci manutenzioni e modifica i box disponibili.",
      href: "/admin/disponibilita",
      button: "Gestisci disponibilità",
    },
  ];

return (
  <section className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl flex-col px-4 py-12 sm:px-6 lg:px-8">
    <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            Area admin
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Riepilogo generale
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-600">
            Una panoramica veloce su prenotazioni, calendario e disponibilità della struttura.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex w-fit items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
        >
          Vai al sito pubblico
        </Link>
      </div>


    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {recapItems.map((item) => (
        <div
          key={item.label}
          className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm"
        >
          <p className="text-sm font-semibold text-slate-500">
            {item.label}
          </p>

          <p className={`mt-2 text-3xl font-bold ${item.valueClassName}`}>
            {item.value}
          </p>

          <p className="mt-2 text-xs font-medium text-slate-500">
            {item.description}
          </p>
        </div>
      ))}
    </div>

      {hasError ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Alcuni dati potrebbero non essere aggiornati correttamente.
        </div>
      ) : null}

    </div>

    <div className="flex-1" />
  </section>
);
}