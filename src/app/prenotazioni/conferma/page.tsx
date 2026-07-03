import Link from "next/link";
import type { Metadata } from "next";
import { Coriandoli } from "@/components/ui/Coriandoli";

export const metadata: Metadata = {
  title: "Richiesta prenotazione ricevuta",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConfermaPrenotazionePage() {
  return (
    <section className="relative mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
      <Coriandoli />

      <div className="w-full rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-xl backdrop-blur sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
          ✓
        </div>

        <p className="mt-8 text-sm font-bold uppercase tracking-wide text-blue-700">
          Richiesta ricevuta
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Abbiamo ricevuto la tua richiesta di prenotazione
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600">
          Ti abbiamo inviato una conferma di ricezione all’indirizzo email
          indicato nel modulo. La prenotazione non è ancora definitiva: verrà
          controllata dalla struttura e riceverai una seconda email con conferma
          o eventuale rifiuto.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-blue-950 shadow-sm transition hover:bg-yellow-300"
          >
            Torna alla home
          </Link>

          <Link
            href="/prenotazioni"
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Nuova richiesta
          </Link>
        </div>
      </div>
    </section>
  );
}
