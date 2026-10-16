/** CDN policy for public blog pages backed by published Supabase content. */
export const blogCacheHeaders = {
  "Cache-Control":
    "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
} as const;
