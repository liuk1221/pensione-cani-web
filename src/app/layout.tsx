import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { siteConfig } from "@/lib/site-config";
import { absoluteUrl, localBusinessJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: `Pensione per cani a Fabriano | ${siteConfig.name}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "pensione cani Fabriano",
    "pensione per cani Ancona",
    "pensione cani Marche",
    "asilo giornaliero cani",
    "box per cani",
    "Pirella Pet Resort",
  ],
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: `Pensione per cani a Fabriano | ${siteConfig.name}`,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: absoluteUrl(siteConfig.socialImage),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - pensione per cani a Fabriano`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Pensione per cani a Fabriano | ${siteConfig.name}`,
    description: siteConfig.description,
    images: [absoluteUrl(siteConfig.socialImage)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50 text-slate-900 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd()),
          }}
        />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
