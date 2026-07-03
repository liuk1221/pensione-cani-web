import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const publicCrawlerRules = {
  allow: "/",
  disallow: ["/api/", "/admin/", "/prenotazioni/conferma"],
};

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        ...publicCrawlerRules,
      },
      {
        userAgent: "OAI-SearchBot",
        ...publicCrawlerRules,
      },
      {
        userAgent: "GPTBot",
        ...publicCrawlerRules,
      },
      {
        userAgent: "ChatGPT-User",
        ...publicCrawlerRules,
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
