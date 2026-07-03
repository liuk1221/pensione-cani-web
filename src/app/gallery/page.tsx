import Image from "next/image";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Gallery della pensione per cani",
  description:
    "Foto e video di Pirella Pet Resort a Fabriano: box per cani, aree esterne recintate, spazi personali e struttura immersa nel verde.",
  path: "/gallery",
  image: "/asset/Struttura_1.jpg",
});

const galleryImages = [
  { src: "/asset/Dog_1.jpg", alt: "Due pastori tedeschi nel loro box esterno", title: "Ospiti a quattro zampe", description: "Momenti tranquilli nei box con area esterna dedicata.", layout: "sm:col-span-2 lg:row-span-2", aspect: "aspect-[4/5] lg:aspect-auto lg:min-h-[44rem]", position: "object-[center_68%]" },
  { src: "/asset/Dog_4.jpg", alt: "Un pastore tedesco riposa nella cuccia", title: "Il tempo del riposo", description: "Cucce accoglienti per rilassarsi dopo il gioco.", layout: "", aspect: "aspect-[4/5]", position: "object-[center_70%]" },
  { src: "/asset/Dog_2.jpg", alt: "Un pastore tedesco nel box con vista sul paesaggio", title: "Aria aperta e natura", description: "Spazi luminosi affacciati sul verde.", layout: "", aspect: "aspect-[4/5]", position: "object-[center_70%]" },
  { src: "/asset/Interiors_1.jpg", alt: "Interno di un box con cuccia, ciotole e area coperta", title: "Spazi personali", description: "Zona coperta, cuccia e tutto il necessario per il soggiorno.", layout: "", aspect: "aspect-[4/5]", position: "object-center" },
  { src: "/asset/Struttura_1.jpg", alt: "Panoramica della pensione immersa nel verde", title: "Immersi nel verde", description: "Una struttura raccolta, tranquilla e circondata dalla natura.", layout: "sm:col-span-2", aspect: "aspect-[16/9]", position: "object-center" },
  { src: "/asset/Struttura_4.jpg", alt: "Aree esterne recintate della pensione", title: "Aree esterne protette", description: "Spazi recintati e organizzati per muoversi in sicurezza.", layout: "sm:col-span-2 lg:col-span-1", aspect: "aspect-[16/10] lg:aspect-[4/5]", position: "object-center" },
];

export default function GalleryPage() {
  return (
    <main className="overflow-hidden">
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Vita al resort</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Spazi, natura e ospiti felici</h1>
          <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">Uno sguardo alla quotidianità del Pirella Pet Resort: box dedicati, momenti di relax e tanto verde intorno.</p>
        </div>

        <div className="mt-10 grid auto-rows-auto gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {galleryImages.map((image, index) => (
            <figure key={image.src} className={`group relative overflow-hidden rounded-[1.75rem] bg-blue-950 shadow-sm ${image.layout} ${image.aspect}`}>
              <Image src={image.src} alt={image.alt} fill priority={index === 0} sizes={image.layout.includes("col-span-2") ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 640px) 100vw, 33vw"} className={`object-cover ${image.position} transition duration-700 group-hover:scale-[1.03]`} />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/5 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                <h2 className="text-xl font-bold">{image.title}</h2>
                <p className="mt-1 max-w-md text-sm leading-6 text-blue-100">{image.description}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="bg-blue-950 px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-yellow-300">In movimento</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Piccoli momenti di una bella vacanza</h2>
            <p className="mt-4 leading-7 text-blue-100">Perché la vita in pensione si racconta meglio vedendo code che si muovono, passeggiate e nuove scoperte.</p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <figure className="overflow-hidden rounded-[1.75rem] bg-black shadow-2xl ring-1 ring-white/15">
              <video controls muted playsInline preload="metadata" className="mx-auto aspect-[9/16] max-h-[42rem] w-full object-cover" aria-label="Un cucciolo ospite del Pirella Pet Resort">
                <source src="/asset/Puppy_1.mp4" type="video/mp4" />
              </video>
              <figcaption className="bg-blue-950 px-5 py-4 text-sm text-blue-100">Nuovi amici e giornate piene di curiosità.</figcaption>
            </figure>
            <figure className="overflow-hidden rounded-[1.75rem] bg-black shadow-2xl ring-1 ring-white/15">
              <video controls muted playsInline preload="metadata" className="aspect-video w-full object-cover" aria-label="Gli spazi esterni del Pirella Pet Resort">
                <source src="/asset/VideoEsterni_1.mp4" type="video/mp4" />
              </video>
              <figcaption className="bg-blue-950 px-5 py-4 text-sm text-blue-100">Sicurezza al primo posto.</figcaption>
            </figure>
          </div>
        </div>
      </section>
    </main>
  );
}
