export const SITE_NAME = "Postdiff";
export const SITE_DESCRIPTION =
  "Postdiff picks the work worth sharing and drafts the post in your voice. You approve every word.";

const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL}`
    : "http://localhost:3000");

const parsedSiteUrl = new URL(configuredSiteUrl);

export const SITE_ORIGIN = parsedSiteUrl.origin;
export const SITE_URL = new URL(SITE_ORIGIN);
