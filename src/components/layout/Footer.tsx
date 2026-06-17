import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}`;

  return (
    <footer className="border-t border-blue-900 bg-blue-950 text-white">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <a
          href={siteConfig.equestrianSiteUrl}
          target="_blank"
          rel="noreferrer"
          className="group grid gap-5 overflow-hidden rounded-[1.75rem] border border-white/15 bg-gradient-to-r from-blue-900 to-blue-800 p-6 shadow-xl transition hover:border-yellow-300/50 hover:to-blue-700 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-7"
          aria-label="Visita il sito del centro ippico La Pirella"
        >
          <Image
            src="/images/lapirella-horse-logo.png"
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 rounded-2xl object-cover shadow-lg shadow-blue-950/25"
          />
          <span>
            <span className="block text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">La famiglia La Pirella</span>
            <span className="mt-1 block text-xl font-bold sm:text-2xl">Scopri anche il nostro centro ippico</span>
            <span className="mt-2 block max-w-2xl text-sm leading-6 text-blue-100">Corsi di equitazione per adulti e bambini, attività e vita di scuderia nel verde di Fabriano.</span>
          </span>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-blue-950 transition group-hover:bg-yellow-300">
            Visita lapirella.it <span aria-hidden="true">↗</span>
          </span>
        </a>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_0.8fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-full bg-blue-900 ring-1 ring-white/20">
              <Image src="/images/logo-pirella-pet-resort-128.png" alt="" fill sizes="44px" className="object-cover" />
            </div>
            <p className="text-lg font-bold">{siteConfig.name}</p>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100">Spazi dedicati, natura e cura quotidiana per una vacanza serena, per lui e per te.</p>
        </div>

        <div>
          <p className="font-semibold text-yellow-300">Esplora</p>
          <nav className="mt-4 flex flex-col items-start gap-2 text-sm text-blue-100" aria-label="Navigazione footer">
            <Link className="transition hover:text-white" href="/pensione">La pensione</Link>
            <Link className="transition hover:text-white" href="/servizi">Servizi</Link>
            <Link className="transition hover:text-white" href="/listino">Listino</Link>
            <Link className="transition hover:text-white" href="/gallery">Gallery</Link>
            <Link className="transition hover:text-white" href="/prenotazioni">Prenotazioni</Link>
          </nav>
        </div>

        <div>
          <p className="font-semibold text-yellow-300">Contatti</p>
          <div className="mt-4 space-y-2 text-sm text-blue-100">
            <p>{siteConfig.address}</p>
            <a className="block transition hover:text-white" href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>{siteConfig.phone}</a>
            <a className="block transition hover:text-white" href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full bg-yellow-400 px-4 py-2 font-bold text-blue-950 transition hover:bg-yellow-300">
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
