export const siteConfig = {
  name: "Pirella Pet Resort",
  legalName: "Pirella Pet Resort",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pirellapetresort.it",
  description:
    "Pensione per cani a Fabriano, immersa nel verde, con box dedicati, aree esterne, asilo giornaliero, soggiorni notturni e prenotazioni online.",
  phone: "+39 338 450 1079",
  email: "info@lapirella.it",
  address: "Frazione Melano 140M, Fabriano (AN)",
  streetAddress: "Frazione Melano 140M",
  locality: "Fabriano",
  region: "AN",
  postalCode: "60044",
  country: "IT",
  areaServed: ["Fabriano", "Provincia di Ancona", "Marche", "Umbria"],
  whatsappNumber: "393384501079",
  equestrianSiteUrl: "https://www.lapirella.it/",
  socialImage: "/asset/Dog_1.jpg",
  navItems: [
    {
      label: "Pensione",
      href: "/pensione",
    },
    {
      label: "Servizi",
      href: "/servizi",
    },
    {
      label: "Listino",
      href: "/listino",
    },
    {
      label: "Gallery",
      href: "/gallery",
    },
    {
      label: "Contatti",
      href: "/contatti",
    },
  ],
};
