import { Schema } from "effect";

import { isNonEmptyText } from "../../../../../backend/shared/text/non-empty-text";
import { siteEnvironment } from "../../../shared/site/site-environment";

type BlogLocale = "en" | "he";

// The blog's rows as PostgREST answers them (public.blog_articles and
// public.blog_article_images), decoded where they are read.
const databaseBlogArticleSchema = Schema.Struct({
  canonical_url: Schema.String,
  category_key: Schema.Literals(["business", "guides", "news"]),
  content: Schema.Array(
    Schema.Struct({
      bullets: Schema.Array(Schema.String),
      heading: Schema.String,
      id: Schema.String,
      imagePosition: Schema.Finite,
      paragraphs: Schema.Array(Schema.String),
      sourceUrls: Schema.Array(Schema.String),
    })
  ),
  description: Schema.String,
  excerpt: Schema.String,
  // jsonb with an empty default, so any of them can be missing.
  image_alt_texts: Schema.Struct({
    context1: Schema.optional(Schema.String),
    context2: Schema.optional(Schema.String),
    context3: Schema.optional(Schema.String),
    hero: Schema.optional(Schema.String),
  }),
  locale: Schema.Literals(["en", "he"]),
  primary_keyword: Schema.String,
  published_at: Schema.String,
  secondary_keywords: Schema.Array(Schema.String),
  slug: Schema.String,
  title: Schema.String,
  translation_group_id: Schema.String,
});

type DatabaseBlogArticle = typeof databaseBlogArticleSchema.Type;

const databaseBlogImageSchema = Schema.Struct({
  height: Schema.Finite,
  mime_type: Schema.String,
  position: Schema.Finite,
  role: Schema.Literals(["context", "hero"]),
  storage_path: Schema.String,
  translation_group_id: Schema.String,
  width: Schema.Finite,
});

type DatabaseBlogImage = typeof databaseBlogImageSchema.Type;

/**
 * A published blog article as read from the database, with its cover image and
 * its other images.
 */
export interface DatabaseBlogPost extends DatabaseBlogArticle {
  imageSrc: string;
  images: readonly DatabaseBlogImage[];
}

const getSupabaseConfig = () => {
  const { supabasePublishableKey: key, supabaseUrl: url } = siteEnvironment;

  if (!(isNonEmptyText(url) && isNonEmptyText(key))) {
    throw new Error("BLOG_NOT_CONFIGURED: missing public Supabase settings");
  }

  return { key, url };
};

const request = async <S extends Schema.ConstraintDecoder<unknown>>(
  path: string,
  schema: S
): Promise<S["Type"]> => {
  const { key, url } = getSupabaseConfig();

  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
    },
  });

  if (!response.ok) {
    throw new Error(`BLOG_REQUEST_FAILED: ${response.status}`);
  }

  return Schema.decodeUnknownSync(schema)(await response.json());
};

const publicImageUrl = (storagePath: string) => {
  const { url } = getSupabaseConfig();

  return `${url}/storage/v1/object/public/blog-images/${storagePath}`;
};

const attachImages = async (
  articles: readonly DatabaseBlogArticle[]
): Promise<DatabaseBlogPost[]> => {
  if (articles.length === 0) {
    return [];
  }

  const groups = articles.map((article) => article.translation_group_id);
  const filter = encodeURIComponent(`(${groups.join(",")})`);

  const images = await request(
    `blog_article_images?select=translation_group_id,role,position,storage_path,mime_type,width,height&translation_group_id=in.${filter}&order=position.asc`,
    Schema.Array(databaseBlogImageSchema)
  );

  return articles.flatMap((article) => {
    const articleImages = images.filter(
      (image) => image.translation_group_id === article.translation_group_id
    );

    const hero = articleImages.find((image) => image.role === "hero");

    return hero
      ? [
          {
            ...article,
            imageSrc: publicImageUrl(hero.storage_path),
            images: articleImages,
          },
        ]
      : [];
  });
};

/**
 * A blog image's public address in Supabase Storage.
 *
 * @param storagePath - The image's path in the blog's storage bucket.
 * @returns The image's URL.
 */
export const getBlogImageUrl = (storagePath: string) =>
  publicImageUrl(storagePath);

/**
 * The published blog articles in one language, newest first, with their images.
 *
 * @param locale - The articles' language.
 * @returns A promise of the articles.
 */
export const fetchPublishedBlogPosts = async (locale: BlogLocale) => {
  const articles = await request(
    `blog_articles?select=translation_group_id,locale,category_key,slug,title,description,excerpt,content,primary_keyword,secondary_keywords,canonical_url,image_alt_texts,published_at&locale=eq.${locale}&status=eq.published&order=published_at.desc`,
    Schema.Array(databaseBlogArticleSchema)
  );

  return await attachImages(articles);
};

/**
 * One published blog article by its slug, with its images.
 *
 * @param locale - The article's language.
 * @param slug - The article's slug.
 * @returns A promise of the article, or null when there is none.
 */
export const fetchPublishedBlogArticle = async (
  locale: BlogLocale,
  slug: string
) => {
  const safeSlug = encodeURIComponent(slug);

  const articles = await request(
    `blog_articles?select=translation_group_id,locale,category_key,slug,title,description,excerpt,content,primary_keyword,secondary_keywords,canonical_url,image_alt_texts,published_at&locale=eq.${locale}&slug=eq.${safeSlug}&status=eq.published&limit=1`,
    Schema.Array(databaseBlogArticleSchema)
  );

  const withImages = await attachImages(articles);

  return withImages.at(0) ?? null;
};
