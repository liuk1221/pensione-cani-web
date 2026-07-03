import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Servizi di pensione e asilo per cani",
  description:
    "Servizi per cani a Fabriano: pensione notturna, asilo giornaliero, aree esterne, sgambamento e gestione personalizzata del soggiorno.",
  path: "/servizi",
});

const mainServices = [
  {
    title: "Pensione notturna",
    description:
      "Soggiorni con box dedicato, routine quotidiana, uscite controllate e attenzione al benessere del cane durante tutta la permanenza.",
  },
  {
    title: "Asilo giornaliero",
    description:
      "Una soluzione pratica per chi ha bisogno di lasciare il cane in un ambiente sicuro per alcune ore o per l'intera giornata.",
  },
  {
    title: "Aree esterne e sgambamento",
    description:
      "Spazi pensati per movimento, esplorazione e momenti di gioco, sempre gestiti in base al carattere e alle abitudini del cane.",
  },
  {
    title: "Gestione personalizzata",
    description:
      "Ogni permanenza viene valutata in base a taglia, eta, carattere, alimentazione, esigenze sanitarie e livello di socialita.",
  },
];

const careServices = [
  "Somministrazione pappa fornita dal proprietario",
  "Alimentazione della struttura su richiesta",
  "Gestione integratori con istruzioni scritte",
  "Inserimento graduale per cani alla prima esperienza",
  "Possibilita di box condiviso per cani compatibili della stessa famiglia",
  "Contatto diretto con la struttura per aggiornamenti e necessita",
];

const processSteps = [
  {
    title: "Richiesta",
    description:
      "Invii la richiesta online scegliendo date e informazioni principali sul cane.",
  },
  {
    title: "Verifica",
    description:
      "Controlliamo disponibilita, esigenze specifiche e compatibilita con la gestione della struttura.",
  },
  {
    title: "Conferma",
    description:
      "La prenotazione diventa effettiva solo dopo conferma da parte della struttura.",
  },
];

const serviceFaqs = [
  {
    question: "Che differenza c'e tra asilo giornaliero e pensione notturna?",
    answer:
      "L'asilo giornaliero e pensato per permanenze diurne senza pernottamento. La pensione notturna include il soggiorno con box dedicato, gestione quotidiana e uscita concordata.",
  },
  {
    question: "Accogliete cani alla prima esperienza in pensione?",
    answer:
      "Si, quando possibile valutiamo un inserimento graduale e raccogliamo informazioni su abitudini, carattere, alimentazione e necessita specifiche.",
  },
  {
    question: "Due cani della stessa famiglia possono stare insieme?",
    answer:
      "Possono condividere lo stesso box solo se sono compatibili, abituati a stare insieme e se la soluzione e sicura per entrambi.",
  },
];

export default function ServiziPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
            Servizi
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Una permanenza organizzata intorno al tuo cane
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
            Che si tratti di poche ore, di una giornata intera o di un soggiorno
            con pernottamento, l&apos;obiettivo e offrire un ambiente ordinato,
            sicuro e attento alle abitudini di ogni ospite.
          </p>
        </div>

        <Link
          href="/prenotazioni"
          className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-blue-950 shadow-sm transition hover:bg-yellow-300"
        >
          Richiedi prenotazione
        </Link>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {mainServices.map((service) => (
          <article
            key={service.title}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 h-12 w-12 rounded-2xl bg-yellow-300" />
            <h2 className="text-2xl font-bold text-slate-950">
              {service.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {service.description}
            </p>
          </article>
        ))}
      </div>

      <section className="mt-10 rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-yellow-300">
              Cura quotidiana
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Servizi utili durante il soggiorno
            </h2>

            <p className="mt-4 text-sm leading-6 text-blue-100">
              Prima dell&apos;ingresso raccogliamo le informazioni piu importanti
              sul cane, cosi da organizzare alimentazione, routine e attenzioni
              particolari in modo chiaro.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {careServices.map((service) => (
              <div
                key={service}
                className="rounded-2xl border border-blue-800 bg-white/10 p-4 text-sm font-semibold leading-6 text-blue-50"
              >
                {service}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 sm:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
            Come funziona
          </p>

          <h2 className="mt-3 text-3xl font-bold text-slate-950">
            Dalla richiesta alla conferma
          </h2>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {processSteps.map((step, index) => (
            <article key={step.title} className="rounded-3xl bg-white p-5">
              <p className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-950 text-sm font-bold text-white">
                {index + 1}
              </p>
              <h3 className="mt-4 text-lg font-bold text-slate-950">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
            Domande frequenti
          </p>

          <h2 className="mt-3 text-3xl font-bold text-slate-950">
            Cosa sapere prima di scegliere il servizio
          </h2>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {serviceFaqs.map((faq) => (
            <article key={faq.question} className="rounded-3xl bg-slate-50 p-5">
              <h3 className="text-lg font-bold text-slate-950">
                {faq.question}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
