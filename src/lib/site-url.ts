// Resolves the site's public URL for use in metadata, sitemap, and robots.
// Production deploys default to the launch domain; dev defaults to localhost.
// NEXT_PUBLIC_SITE_URL overrides both (useful for preview deploys).

const PRODUCTION_URL = "https://learnai.robennals.org";
const DEV_URL = "http://localhost:3000";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production" ? PRODUCTION_URL : DEV_URL);
