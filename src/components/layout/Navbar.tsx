"use client";

import Link from "next/link";
import { useState } from "react";
import { siteConfig } from "@/lib/site-config";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-yellow-300">
            LOGO
          </div>

          <div className="leading-tight">
            <p className="font-bold text-slate-900">{siteConfig.name}</p>
            <p className="text-xs text-slate-500">La miglior vacanza per il tuo migliore amico</p>
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {siteConfig.navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-700 transition hover:text-blue-700"
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/prenotazioni"
            className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-bold text-blue-950 shadow-sm transition hover:bg-yellow-300"
          >
            Prenota ora
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 md:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-label="Apri menu"
        >
          Menu
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {siteConfig.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-700"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/prenotazioni"
              className="rounded-full bg-yellow-400 px-5 py-3 text-center text-sm font-bold text-blue-950"
              onClick={() => setIsOpen(false)}
            >
              Prenota ora
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}