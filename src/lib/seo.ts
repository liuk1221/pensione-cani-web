import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const publicRoutes = [
  "",
  "/pensione",
  "/servizi",
  "/listino",
  "/gallery",
  "/contatti",
  "/prenotazioni",
] as const;

export function absoluteUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, siteConfig.siteUrl).toString();
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: (typeof publicRoutes)[number];
  image?: string;
};

export function createPageMetadata({
  title,
  description,
  path,
  image = siteConfig.socialImage,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: "it_IT",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} - pensione per cani a Fabriano`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function localBusinessJsonLd() {
  const siteUrl = absoluteUrl("/");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${siteUrl}#localbusiness`,
        name: siteConfig.name,
        legalName: siteConfig.legalName,
        description: siteConfig.description,
        url: siteUrl,
        telephone: siteConfig.phone,
        email: siteConfig.email,
        image: [
          absoluteUrl("/asset/Dog_1.jpg"),
          absoluteUrl("/asset/Struttura_1.jpg"),
          absoluteUrl("/asset/Interiors_1.jpg"),
        ],
        logo: absoluteUrl("/images/logo-pirella-pet-resort-128.png"),
        priceRange: "EUR 10-20",
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.streetAddress,
          addressLocality: siteConfig.locality,
          addressRegion: siteConfig.region,
          postalCode: siteConfig.postalCode,
          addressCountry: siteConfig.country,
        },
        areaServed: siteConfig.areaServed.map((area) => ({
          "@type": "Place",
          name: area,
        })),
        makesOffer: [
          {
            "@type": "Offer",
            name: "Pensione notturna per cani",
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            url: absoluteUrl("/listino"),
          },
          {
            "@type": "Offer",
            name: "Asilo giornaliero per cani",
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            url: absoluteUrl("/listino"),
          },
        ],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: siteConfig.phone,
          email: siteConfig.email,
          contactType: "customer service",
          areaServed: "IT",
          availableLanguage: ["Italian"],
        },
        sameAs: [siteConfig.equestrianSiteUrl],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        name: siteConfig.name,
        url: siteUrl,
        inLanguage: "it-IT",
        publisher: {
          "@id": `${siteUrl}#localbusiness`,
        },
      },
    ],
  };
}
