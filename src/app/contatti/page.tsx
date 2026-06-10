import { siteConfig } from "@/lib/site-config";

const encodedAddress = encodeURIComponent(
  `${siteConfig.name}, ${siteConfig.address}`,
);
const phoneHref = `tel:${siteConfig.phone.replace(/\s/g, "")}`;
const emailHref = `mailto:${siteConfig.email}`;
const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}`;
const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
const mapEmbedUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;

const contactMethods = [
  {
    label: "Telefono",
    value: siteConfig.phone,
    href: phoneHref,
    action: "Chiama",
  },
  {
    label: "Email",
    value: siteConfig.email,
    href: emailHref,
    action: "Scrivi",
  },
  {
    label: "WhatsApp",
    value: "Messaggio diretto",
    href: whatsappUrl,
    action: "Apri chat",
  },
];

export default function ContattiPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
            Contatti
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Parliamo della permanenza del tuo cane
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Per richieste, disponibilita, informazioni sui soggiorni o dettagli
            prima della prenotazione, puoi contattarci direttamente. Ti
            risponderemo il prima possibile con tutte le indicazioni utili.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {contactMethods.map((method) => (
              <a
                key={method.label}
                href={method.href}
                target={method.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  method.href.startsWith("http") ? "noreferrer" : undefined
                }
                className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
              >
                <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
                  {method.label}
                </p>

                <p className="mt-2 text-base font-semibold text-slate-950">
                  {method.value}
                </p>

                <p className="mt-3 text-sm font-bold text-slate-500 transition group-hover:text-blue-800">
                  {method.action}
                </p>
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
            <iframe
              title={`Mappa ${siteConfig.name}`}
              src={mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[360px] w-full border-0 sm:h-[440px]"
            />
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
                Dove siamo
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {siteConfig.address}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Premi sul bottone e apri le indicazioni sul navigatore del dispositivo.
              </p>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-blue-950 shadow-sm transition hover:bg-yellow-300"
            >
              Naviga
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 rounded-[2rem] bg-blue-950 p-6 text-white sm:p-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-yellow-300">
              Prenotazioni
            </p>
            <p className="mt-3 text-sm leading-6 text-blue-100">
              Le richieste online vengono sempre verificate e confermate dalla
              struttura prima di diventare effettive.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-yellow-300">
              Prima del soggiorno
            </p>
            <p className="mt-3 text-sm leading-6 text-blue-100">
              Se il cane ha esigenze particolari, abitudini, farmaci o note
              alimentari, indicacele in fase di richiesta.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-yellow-300">
              Risposta rapida
            </p>
            <p className="mt-3 text-sm leading-6 text-blue-100">
              Per comunicazioni veloci, WhatsApp e telefono sono i canali piu
              diretti per parlare con noi.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
