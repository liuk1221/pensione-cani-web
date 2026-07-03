import Link from "next/link";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { HeroSlideshow } from "@/components/home/HeroSlideshow";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Pensione per cani a Fabriano",
  description:
    "Pirella Pet Resort e una pensione per cani a Fabriano con box dedicati, aree esterne, asilo giornaliero, soggiorni notturni e prenotazioni online.",
  path: "",
});

const services = [
  {
    title: "Pensione giornaliera e notturna",
    description:
      "Accoglienza sicura e controllata per soggiorni brevi o lunghi.",
  },
  {
    title: "Box dedicati",
    description:
      "Ogni cane avrà a disposizione un ampio box e un'area esterna dedicati solo a lui.",
  },
  {
    title: "Area gioco e sgambamento",
    description:
      "Spazi pensati per movimento, socializzazione e benessere del cane.",
  },
  {
    title: "Contatto diretto",
    description:
      "Richieste online, conferma via email e contatto rapido tramite WhatsApp.",
  },
];

const availabilityPreview = [
  {
    label: "Disponibile",
    color: "bg-green-500",
    description: "diversi box liberi",
  },
  {
    label: "Pochi posti",
    color: "bg-yellow-400",
    description: "disponibilità limitata",
  },
  {
    label: "Completo",
    color: "bg-red-500",
    description: "nessuno slot libero",
  },
];

const homeFaqs = [
  {
    question: "Dove si trova Pirella Pet Resort?",
    answer:
      "Pirella Pet Resort si trova in Frazione Melano 140M a Fabriano, in provincia di Ancona, all'interno del contesto verde del Circolo Ippico La Pirella.",
  },
  {
    question: "La struttura offre pensione notturna per cani?",
    answer:
      "Si. La struttura accoglie cani per soggiorni con pernottamento, con box dedicato, routine quotidiana, aree esterne e molto altro!",
  },
  {
    question: "Posso richiedere disponibilita online?",
    answer:
      "Si. Dal modulo prenotazioni puoi scegliere il periodo, inserire le informazioni del cane e ricevere una prima email di riepilogo. La richiesta diventa effettiva dopo conferma della struttura.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-yellow-300 px-4 py-2 text-sm font-bold text-blue-950">
              Pensione per cani
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Un posto sicuro e accogliente per il tuo cane.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Richiedi una prenotazione online, controlla la disponibilità e
              ricevi conferma direttamente via email.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/prenotazioni"
                className="rounded-full bg-yellow-400 px-6 py-3 text-center font-bold text-blue-950 shadow-lg transition hover:bg-yellow-300"
              >
                Richiedi prenotazione
              </Link>

              <Link
                href="/contatti"
                className="rounded-full border border-white/40 px-6 py-3 text-center font-bold text-white transition hover:bg-white/10"
              >
                Contattaci
              </Link>
            </div>
          </div>

          <HeroSlideshow />
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Servizi"
          title="Tutto ciò che serve per un soggiorno sereno"
          description="Cura, sicurezza e spazi dedicati: ogni ospite trova attenzioni su misura e i proprietari restano sempre aggiornati."
        />

        <div className="mx-auto mt-12 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <article
              key={service.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 h-12 w-12 rounded-2xl bg-yellow-300" />
              <h3 className="text-lg font-bold text-slate-950">
                {service.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {service.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
              Disponibilità
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Controlla la disponibilità dei box
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Le prenotazioni vengono sempre confermate manualmente.
            </p>

            <div className="mt-8 space-y-4">
              {availabilityPreview.map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <span className={`h-4 w-4 rounded-full ${item.color}`} />
                  <div>
                    <p className="font-semibold text-slate-950">{item.label}</p>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="grid grid-cols-7 gap-2 text-center text-sm">
              {Array.from({ length: 28 }).map((_, index) => {
                const color =
                  index % 9 === 0
                    ? "bg-red-500"
                    : index % 4 === 0
                      ? "bg-yellow-400"
                      : "bg-green-500";

                return (
                  <div
                    key={index}
                    className={`flex aspect-square items-center justify-center rounded-xl font-bold text-white ${color}`}
                  >
                    {index + 1}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Prenotazioni"
          title="Una richiesta semplice, una conferma personale"
          description="Scegli il periodo e inviaci le informazioni del tuo cane. Riceverai subito una mail di riepilogo e ti ricontatteremo per confermare il soggiorno."
        />

        <div className="mx-auto mt-10 max-w-3xl rounded-3xl bg-blue-950 p-8 text-center text-white">
          <h3 className="text-2xl font-bold">
            Vuoi prenotare?
          </h3>
          <p className="mt-3 text-blue-100">
            Seleziona quando. Compila il modulo con le informazioni. Invia. Ti risponderemo via email!
          </p>

          <Link
            href="/prenotazioni"
            className="mt-6 inline-flex rounded-full bg-yellow-400 px-6 py-3 font-bold text-blue-950 transition hover:bg-yellow-300"
          >
            Vai al modulo
          </Link>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Domande frequenti"
            title="Alcune risposte rapide alle domande più frequenti"
            description="Le informazioni essenziali per capire dove siamo, come funziona la richiesta e quali soggiorni possiamo gestire."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {homeFaqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
              >
                <h3 className="text-lg font-bold text-slate-950">
                  {faq.question}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
