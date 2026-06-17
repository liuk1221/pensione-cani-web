"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  {
    src: "/asset/Dog_1.jpg",
    alt: "Due pastori tedeschi ospiti nel loro box esterno",
    eyebrow: "Ospiti felici",
    caption: "Spazi dedicati, ombra e tranquillità",
    position: "object-[center_68%]",
  },
  {
    src: "/asset/Dog_4.jpg",
    alt: "Un pastore tedesco riposa nella sua cuccia",
    eyebrow: "Riposo e comfort",
    caption: "Ogni cane ha il suo spazio per sentirsi al sicuro",
    position: "object-[center_70%]",
  },
  {
    src: "/asset/Dog_2.jpg",
    alt: "Un cane si rilassa nel box con vista sulle montagne",
    eyebrow: "Nel verde",
    caption: "Una vacanza serena, circondati dalla natura",
    position: "object-[center_72%]",
  },
  {
    src: "/asset/Struttura_1.jpg",
    alt: "Vista panoramica degli spazi esterni della pensione",
    eyebrow: "La struttura",
    caption: "Aree esterne protette e immerse nel verde",
    position: "object-center",
  },
];

export function HeroSlideshow() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (
      isPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const interval = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % slides.length),
      5500,
    );
    return () => window.clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      className="relative min-h-[31rem] overflow-hidden rounded-[2rem] bg-blue-950 shadow-2xl ring-1 ring-white/20 sm:min-h-[38rem] lg:min-h-[44rem]"
      aria-roledescription="carosello"
      aria-label="La vita al Pirella Pet Resort"
    >
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-1000 motion-reduce:transition-none ${index === activeSlide ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-hidden={index !== activeSlide}
        >
          <Image
            src={slide.src}
            alt={index === activeSlide ? slide.alt : ""}
            fill
            priority={index === 0}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={`object-cover ${slide.position} transition-transform duration-[6000ms] motion-reduce:transition-none ${index === activeSlide ? "scale-105" : "scale-100"}`}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/10 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">
          {slides[activeSlide].eyebrow}
        </p>
        <p className="mt-2 max-w-md text-xl font-semibold leading-snug sm:text-2xl">
          {slides[activeSlide].caption}
        </p>
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2" aria-label="Seleziona immagine">
            {slides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={`h-2 rounded-full transition-all ${index === activeSlide ? "w-9 bg-yellow-300" : "w-2 bg-white/60 hover:bg-white"}`}
                aria-label={`Mostra immagine ${index + 1}: ${slide.eyebrow}`}
                aria-current={index === activeSlide ? "true" : undefined}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIsPaused((paused) => !paused)}
            className="rounded-full border border-white/30 bg-black/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/15"
            aria-label={isPaused ? "Riprendi slideshow" : "Metti in pausa lo slideshow"}
          >
            {isPaused ? "Riprendi" : "Pausa"}
          </button>
        </div>
      </div>
    </div>
  );
}
