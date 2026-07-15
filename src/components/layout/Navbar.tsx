"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/lib/site-config";
import Image from "next/image";

const adminNavItems = [
  {
    label: "Prenotazioni",
    href: "/admin/prenotazioni",
  },
  {
    label: "Calendario",
    href: "/admin/calendario",
  },
  {
    label: "Disponibilità",
    href: "/admin/disponibilita",
  },
  {
    label: "Sito Pubblico",
    href: "/",
  },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const isAdminArea =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");

  async function handleAdminLogout() {
    try {
      setIsLoggingOut(true);

      await fetch("/api/admin/logout", {
        method: "POST",
      });

      setIsOpen(false);
      router.replace("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  const navItems = isAdminArea ? adminNavItems : siteConfig.navItems;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href={isAdminArea ? "/admin/prenotazioni" : "/"}
          className="flex items-center gap-3"
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-blue-900">
            <Image
              src="/images/logo-pirella-pet-resort-128.png"
              alt={`${siteConfig.name} logo`}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>

          <div className="leading-tight">
            <p className="font-bold text-slate-900">{siteConfig.name}</p>
            <p className="hidden text-xs text-slate-500 min-[420px]:block">
              {isAdminArea
                ? "Area amministratore"
                : "La miglior vacanza per il tuo migliore amico"}
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition ${
                pathname === item.href
                  ? "text-blue-800"
                  : "text-slate-700 hover:text-blue-700"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {isAdminArea ? (
            <button
              type="button"
              onClick={handleAdminLogout}
              disabled={isLoggingOut}
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "Uscita..." : "Esci admin"}
            </button>
          ) : (
            <Link
              href="/prenotazioni"
              className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-bold text-blue-950 shadow-sm transition hover:bg-yellow-300"
            >
              Prenota ora
            </Link>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 md:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-label={isOpen ? "Chiudi menu" : "Apri menu"}
        >
          Menu
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium ${
                  pathname === item.href ? "text-blue-800" : "text-slate-700"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {isAdminArea ? (
              <button
                type="button"
                onClick={handleAdminLogout}
                disabled={isLoggingOut}
                className="rounded-full bg-red-600 px-5 py-3 text-center text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Uscita..." : "Esci admin"}
              </button>
            ) : (
              <Link
                href="/prenotazioni"
                className="rounded-full bg-yellow-400 px-5 py-3 text-center text-sm font-bold text-blue-950"
                onClick={() => setIsOpen(false)}
              >
                Prenota ora
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
