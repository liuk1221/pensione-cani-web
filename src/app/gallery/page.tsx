const gallerySlots = [
  "Esterni",
  "Box",
  "Area gioco",
  "Sgambamento",
  "Ospiti",
  "Dettagli struttura",
];

export default function GalleryPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-700">
          Gallery
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Foto e momenti dalla struttura
        </h1>

        <p className="mt-5 text-base leading-7 text-slate-600">
          WORK IN PROGRESS!!
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {gallerySlots.map((slot, index) => (
          <article
            key={slot}
            className={
              index === 0
                ? "rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2"
                : "rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm"
            }
          >
            <div className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-slate-100 text-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
                  {slot}
                </p>
                <p className="mt-3 text-lg font-bold text-slate-500">
                  WORK IN PROGRESS!!
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-10 rounded-[2rem] bg-blue-950 p-6 text-white shadow-sm sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-yellow-300">
              Video
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Uno spazio per raccontare la vita in pensione
            </h2>
          </div>

          <div className="flex aspect-video items-center justify-center rounded-3xl border border-blue-800 bg-white/10 text-center">
            <p className="text-lg font-bold text-blue-100">
              WORK IN PROGRESS!!
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}
