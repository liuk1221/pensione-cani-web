import Link from "next/link";
import { SectionTitle } from "@/components/ui/SectionTitle";

const services = [
  {
    title: "Pensione giornaliera e notturna",
    description:
      "Accoglienza sicura e controllata per soggiorni brevi o lunghi.",
  },
  {
    title: "Box dedicati",
    description:
      "Ogni cane avrà a disposizione un ampio box e area esterna dedicato solo a lui.",
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

export default function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
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

          <div className="rounded-3xl bg-white/10 p-4 shadow-2xl ring-1 ring-white/20">
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-slate-100 text-center">
              <div>
                <p className="text-lg font-bold text-slate-700">
                  Immagine struttura
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  !!! WORK IN PROGRESS !!!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Servizi"
          title="Tutto quello che serve per una permanenza serena"
          description="Una struttura pensata per gestire accoglienza, sicurezza, disponibilità e comunicazione con i proprietari."
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
              Calendario prenotazione in base ai box disponibili
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
          title="Richiesta semplice e conferma rapida"
          description="Invia la richiesta per lo slot che vorresti prenotare, riceverai subito una mail di avvenuta ricezione. Un nostro operatore ti ricontatterà il prima possibile per confermare la tua prenotazione!"
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
    </>
  );
}