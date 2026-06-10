const structureSections = [
  "La struttura",
  "I box",
  "Gli spazi esterni",
  "La routine quotidiana",
];

const featureSlots = [
  "Accoglienza",
  "Sicurezza",
  "Pulizia",
  "Benessere",
  "Gestione ospiti",
  "Contatto con i proprietari",
];

export default function PensionePage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
            La pensione
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Chi siamo?
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            WORK IN PROGRESS!!
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-slate-100 text-center">
            <p className="text-lg font-bold text-slate-500">
              WORK IN PROGRESS!!
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {structureSections.map((section) => (
          <article
            key={section}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              {section}
            </p>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">
              WORK IN PROGRESS!!
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              WORK IN PROGRESS!!
            </p>
          </article>
        ))}
      </div>

      <section className="mt-10 rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-yellow-300">
            Filosofia
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Un metodo chiaro, ordinato e rispettoso
          </h2>
          <p className="mt-4 text-sm leading-6 text-blue-100">
            WORK IN PROGRESS!!
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featureSlots.map((feature) => (
            <div
              key={feature}
              className="rounded-2xl border border-blue-800 bg-white/10 p-4"
            >
              <p className="text-sm font-bold text-yellow-300">{feature}</p>
              <p className="mt-2 text-sm leading-6 text-blue-100">
                WORK IN PROGRESS!!
              </p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
