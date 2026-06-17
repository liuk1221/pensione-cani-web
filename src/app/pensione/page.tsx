import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const structureSections = [
  {
    eyebrow: "I box",
    title: "Uno spazio personale, dentro e fuori",
    description:
      "Ogni ospite dispone di un box dedicato con zona coperta, cuccia e accesso alla propria area esterna. Un ambiente protetto dove riposare e ritrovare i propri ritmi.",
    image: "/asset/Dog_3.jpg",
    alt: "Due pastori tedeschi nel loro box con area esterna",
    position: "object-[center_65%]",
  },
  {
    eyebrow: "Gli spazi esterni",
    title: "Natura, movimento e aria aperta",
    description:
      "La struttura è immersa nel verde e dispone di aree esterne recintate. Gli spazi sono organizzati per offrire movimento, stimoli e momenti all'aperto in sicurezza.",
    image: "/asset/Struttura_1.jpg",
    alt: "Le aree esterne recintate della pensione immerse nel verde",
    position: "object-center",
  },
  {
    eyebrow: "La routine quotidiana",
    title: "Giornate regolari, attenzioni su misura",
    description:
      "Pasti, pulizia, riposo e attività scandiscono la giornata. Osserviamo il carattere e le abitudini di ciascun cane per gestire il soggiorno con equilibrio e rispetto.",
    image: "/asset/Dog_4.jpg",
    alt: "Un pastore tedesco riposa nella sua cuccia",
    position: "object-[center_70%]",
  },
];

const features = [
  {
    title: "Accoglienza",
    description: "Conosciamo il cane, le sue abitudini e le necessità del soggiorno.",
  },
  {
    title: "Sicurezza",
    description: "Spazi dedicati e aree esterne protette per una gestione attenta.",
  },
  {
    title: "Pulizia",
    description: "Ambienti ordinati e curati come parte della routine quotidiana.",
  },
  {
    title: "Benessere",
    description: "Rispettiamo tempi di riposo, movimento e caratteristiche individuali.",
  },
  {
    title: "Gestione degli ospiti",
    description: "Ogni inserimento viene valutato con attenzione e senza forzature.",
  },
  {
    title: "Contatto diretto",
    description: "Restiamo disponibili per aggiornamenti e comunicazioni sul soggiorno.",
  },
];

export default function PensionePage() {
  return (
    <main className="overflow-hidden">
      <section className="bg-blue-950 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-yellow-300">
              La pensione
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Un luogo pensato per farli sentire al sicuro
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Spazi personali, verde e una routine attenta: al Pirella Pet Resort
              ogni cane viene accolto rispettando carattere, abitudini e tempi.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/prenotazioni"
                className="rounded-full bg-yellow-400 px-6 py-3 text-center font-bold text-blue-950 transition hover:bg-yellow-300"
              >
                Richiedi un soggiorno
              </Link>
              <Link
                href="/gallery"
                className="rounded-full border border-white/35 px-6 py-3 text-center font-bold text-white transition hover:bg-white/10"
              >
                Guarda la gallery
              </Link>
            </div>
          </div>

          <div className="relative min-h-[30rem] overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-white/15 sm:min-h-[38rem]">
            <Image
              src="/asset/Dog_1.jpg"
              alt="Due pastori tedeschi ospiti del Pirella Pet Resort"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-[center_68%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/75 via-transparent to-transparent" />
            <p className="absolute bottom-0 left-0 max-w-md p-6 text-lg font-semibold leading-7 sm:p-8 sm:text-xl">
              Ognuno con il proprio spazio, tutti con le attenzioni che meritano.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem] bg-slate-200 shadow-sm sm:min-h-[34rem]">
            <Image
              src="/asset/Struttura_2.jpg"
              alt="La pensione Pirella Pet Resort circondata dalla natura"
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover object-center"
            />
          </div>

          <div className="lg:pl-6">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
              Chi siamo
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Presenza, rispetto e cura quotidiana
            </h2>
            <div className="mt-6 space-y-4 text-base leading-7 text-slate-600">
              <p>
                Pirella Pet Resort è una pensione per cani immersa nel verde di
                Fabriano, all&apos;interno del Circolo Ippico La Pirella. Nasce per
                offrire un luogo tranquillo e organizzato dove lasciare il proprio
                miglior amico a quattro zampe.
              </p>

              <p>
                Da oltre 15 anni ci occupiamo ogni giorno della gestione e della
                pensione dei cavalli del nostro centro e dei nostri clienti. Da
                questa esperienza è nata l&apos;idea di estendere la stessa cura anche
                ai compagni più piccoli, creando uno spazio pensato per il benessere
                dei cani.
              </p>

              <p>
                Crediamo che ogni cane abbia il suo carattere, le sue abitudini e
                il suo modo di vivere una nuova esperienza. Per questo preferiamo
                un&apos;accoglienza attenta, spazi personali e una gestione che non
                forza i tempi dell&apos;animale.
              </p>

              <p>
                Durante il soggiorno ci prendiamo cura degli ospiti con presenza
                e semplicità, mantenendo un contatto diretto con le loro famiglie.
                Il nostro obiettivo è far vivere una vacanza serena a loro e una
                partenza più tranquilla a voi.
              </p>
            </div>

            <a
              href={siteConfig.equestrianSiteUrl}
              target="_blank"
              rel="noreferrer"
              className="group mt-7 flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 transition hover:border-blue-200 hover:bg-blue-100/70"
            >
              <Image
                src="/images/lapirella-horse-logo.png"
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-xl object-cover"
              />
              <span className="min-w-0">
                <span className="block text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                  La stessa passione, anche per i cavalli
                </span>
                <span className="mt-1 block font-semibold text-slate-950">
                  Scopri il Centro Ippico La Pirella
                  <span className="ml-2 transition group-hover:translate-x-0.5" aria-hidden="true">↗</span>
                </span>
              </span>
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
              Gli ambienti
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Tutto ciò che serve per stare bene
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              La struttura accompagna i diversi momenti della giornata, dal
              movimento al riposo, mantenendo ogni ospite nel proprio equilibrio.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {structureSections.map((section) => (
              <article
                key={section.title}
                className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 shadow-sm"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={section.image}
                    alt={section.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className={`object-cover ${section.position} transition duration-700 group-hover:scale-[1.03]`}
                  />
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                    {section.eyebrow}
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-slate-950">
                    {section.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {section.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-blue-950 p-6 text-white shadow-xl sm:p-10 lg:p-12">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-300">
              Il nostro modo di lavorare
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Attenzioni concrete, ogni giorno
            </h2>
            <p className="mt-4 leading-7 text-blue-100">
              Una buona permanenza nasce da gesti semplici e costanti: ascoltare,
              osservare e prendersi cura di ogni ospite con responsabilità.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-blue-800 bg-white/10 p-5"
              >
                <h3 className="font-bold text-yellow-300">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-blue-100">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-5 border-t border-blue-800 pt-8 sm:flex-row sm:items-center">
            <p className="max-w-2xl text-lg font-semibold">
              Vuoi capire se il Pirella Pet Resort è il posto giusto per il tuo cane?
            </p>
            <Link
              href="/contatti"
              className="shrink-0 rounded-full bg-yellow-400 px-6 py-3 text-center font-bold text-blue-950 transition hover:bg-yellow-300"
            >
              Parliamone
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
