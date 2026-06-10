import Link from "next/link";
import {
  listinoConfig,
  type ListinoPriceRow,
  type ListinoPromotion,
} from "../../lib/listino-config";

type PriceSection = {
  title: string;
  description: string;
  rows: ListinoPriceRow[];
};

function PriceTable({
  title,
  description,
  rows,
}: PriceSection) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-blue-950 text-white">
            <tr>
              <th scope="col" className="px-4 py-3 font-bold">
                Servizio
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 font-bold md:table-cell"
              >
                Dettagli
              </th>
              <th scope="col" className="px-4 py-3 text-right font-bold">
                Tariffa
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => (
              <tr key={row.service} className="bg-white align-top">
                <td className="px-4 py-4">
                  <p className="font-bold text-slate-950">{row.service}</p>

                  <p className="mt-1 text-xs leading-5 text-slate-500 md:hidden">
                    {row.details}
                  </p>
                </td>

                <td className="hidden px-4 py-4 leading-6 text-slate-600 md:table-cell">
                  {row.details}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-blue-900">
                  {row.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


export default function ListinoPage() {
  const priceSections: PriceSection[] = [
    {
      title: "Tariffe giornaliere",
      description:
        "Soluzioni per chi ha bisogno di lasciare il cane durante il giorno, senza pernottamento.",
      rows: listinoConfig.dailyRates,
    },
    {
      title: "Pensione notturna",
      description:
        "Tariffe per soggiorni con pernottamento, box dedicato e gestione quotidiana.",
      rows: listinoConfig.overnightRates,
    },
    {
      title: "Servizi extra",
      description:
        "Servizi opzionali da concordare al momento della richiesta o prima dell'ingresso.",
      rows: listinoConfig.extraServices,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
            Listino prezzi
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Tariffe chiare per ogni tipo di permanenza
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
            Consulta le tariffe indicative per asilo giornaliero, pensione
            notturna e servizi extra. La conferma finale viene sempre valutata
            in base alle esigenze del cane e alla disponibilità della struttura.
          </p>
        </div>

        <Link
          href="/prenotazioni"
          className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-blue-950 shadow-sm transition hover:bg-yellow-300"
        >
          Richiedi disponibilità
        </Link>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {priceSections.map((section) => (
          <PriceTable
            key={section.title}
            title={section.title}
            description={section.description}
            rows={section.rows}
          />
        ))}
      </div>

      <section className="mt-10 rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-yellow-300">
              Promozioni
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Agevolazioni pensate per famiglie e soggiorni lunghi
            </h2>

            <p className="mt-4 text-sm leading-6 text-blue-100">
              Alcune situazioni permettono una gestione più efficiente degli
              spazi e della routine. Quando è sicuro per i cani, possiamo
              proporre condizioni dedicate.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-blue-800 bg-white text-slate-950">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <thead className="bg-yellow-400 text-blue-950">
                <tr>
                  <th scope="col" className="w-[56%] px-3 py-3 font-bold sm:px-4 md:w-[30%]">
                    Formula
                  </th>
                  <th
                    scope="col"
                    className="hidden px-4 py-3 font-bold md:table-cell md:w-[45%]"
                  >
                    Condizione
                  </th>
                  <th scope="col" className="w-[44%] px-3 py-3 text-right font-bold sm:px-4 md:w-[25%]">
                    Vantaggio
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {listinoConfig.promotions.map((promotion: ListinoPromotion) => (
                  <tr key={promotion.name} className="align-top">
                    <td className="px-3 py-4 sm:px-4">
                      <p className="font-bold">{promotion.name}</p>

                      <p className="mt-1 text-xs leading-5 text-slate-500 md:hidden">
                        {promotion.condition}
                      </p>
                    </td>

                    <td className="hidden px-4 py-4 leading-6 text-slate-600 md:table-cell">
                      {promotion.condition}
                    </td>

                    <td className="break-words px-3 py-4 text-right font-bold leading-5 text-blue-900 sm:px-4">
                      {promotion.benefit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-950">
          Termini e Condizioni
        </h2>

        <ul className="mt-4 space-y-2 text-xs leading-5 text-slate-600">
          {listinoConfig.conditions.map((condition: string) => (
            <li key={condition} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />
              <span>{condition}</span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
