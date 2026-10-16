import { Schema } from "effect";

const httpUrl = Schema.String.check(Schema.isPattern(/^https?:\/\/\S+$/u));

// The website's public settings (VITE_*, in .env.local). Analytics load only
// when VITE_GOOGLE_TAG_ID is set; the blog uses the same
// Supabase project and publishable key as the app (VITE_SUPABASE_URL,
// VITE_SUPABASE_KEY). A malformed value fails the build instead of shipping
// a broken link.
const siteEnvironmentSchema = Schema.Struct({
  VITE_SITE_URL: Schema.optional(httpUrl),
  VITE_GOOGLE_TAG_ID: Schema.optional(
    Schema.String.check(Schema.isPattern(/^G(?:T)?-[A-Z0-9]+$/u))
  ),
  VITE_SUPABASE_URL: Schema.optional(httpUrl),
  VITE_SUPABASE_KEY: Schema.optional(Schema.NonEmptyString),
});

const decoded = Schema.decodeSync(siteEnvironmentSchema)(
  Object.fromEntries(
    Object.entries(import.meta.env).filter(([, value]) => value !== "")
  )
);

// The production address of the marketing site. Committed discovery files
// (public/sitemap.xml, robots.txt, llms.txt) always point here, whatever
// VITE_SITE_URL a local build runs with.
export const PRODUCTION_SITE_ORIGIN = "https://example.com";

export const siteEnvironment = {
  // The marketing site, for canonical URLs and structured data.
  siteUrl: decoded.VITE_SITE_URL ?? PRODUCTION_SITE_ORIGIN,
  googleTagId: decoded.VITE_GOOGLE_TAG_ID,
  supabaseUrl: decoded.VITE_SUPABASE_URL,
  supabasePublishableKey: decoded.VITE_SUPABASE_KEY,
};
