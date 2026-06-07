import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}`;

  return (
    <footer className="border-t border-slate-200 bg-blue-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="text-lg font-bold">{siteConfig.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-blue-100">
            Pensione per cani con gestione delle prenotazioni, disponibilità
            aggiornata e contatto diretto con la struttura.
          </p>
        </div>

        <div>
          <p className="font-semibold text-yellow-300">Navigazione</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-blue-100">
            <Link href="/pensione">Pensione</Link>
            <Link href="/servizi">Servizi</Link>
            <Link href="/listino">Listino</Link>
            <Link href="/gallery">Gallery</Link>
            <Link href="/prenotazioni">Prenotazioni</Link>
          </div>
        </div>

        <div>
          <p className="font-semibold text-yellow-300">Contatti</p>
          <div className="mt-4 space-y-2 text-sm text-blue-100">
            <p>{siteConfig.address}</p>
            <p>{siteConfig.phone}</p>
            <p>{siteConfig.email}</p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full bg-yellow-400 px-4 py-2 font-bold text-blue-950 transition hover:bg-yellow-300"
            >
              Scrivici su WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-blue-900 px-4 py-4 text-center text-xs text-blue-200">
        © {new Date().getFullYear()} {siteConfig.name}. Tutti i diritti riservati.
      </div>
    </footer>
  );
}