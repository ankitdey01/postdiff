import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "./site";

const LAST_MODIFIED = new Date("2026-10-26T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/about",
    "/contact",
    "/docs",
    "/pricing",
    "/privacy",
    "/tos",
  ].map((path) => ({
    url: `${SITE_ORIGIN}${path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
