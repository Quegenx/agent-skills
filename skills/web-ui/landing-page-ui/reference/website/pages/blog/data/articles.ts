import {
  blog_category_business,
  blog_category_guides,
  blog_category_news,
} from "#/paraglide/messages";

import { getBlogImageUrl } from "./blog-data";
import type { DatabaseBlogPost } from "./blog-data";

// A message function or an article's own text, which the database already
// holds in the page's locale.
type BlogArticleCopy = () => string;

type BlogArticleTextStyle = "code" | "emphasis" | "strong" | "text";

/**
 * One piece of an article's rich text: plain, code, emphasis or strong text, a
 * link, or a line break.
 */
export type BlogArticleInline =
  | { copy: BlogArticleCopy; type: BlogArticleTextStyle }
  | {
      copy: BlogArticleCopy;
      external?: boolean;
      href: string;
      type: "link";
    }
  | { type: "break" };

/**
 * An article's rich text, as its pieces in order.
 */
export type BlogArticleRichText = readonly BlogArticleInline[];

/**
 * One block of an article's body: a paragraph, a heading, a list, an image, a
 * quote or a table.
 */
export type BlogArticleBlock =
  | { content: BlogArticleRichText; type: "paragraph" }
  | {
      id: string;
      level: 2 | 3 | 4;
      text: BlogArticleCopy;
      type: "heading";
    }
  | {
      items: readonly BlogArticleRichText[];
      ordered?: boolean;
      type: "list";
    }
  | { content: BlogArticleRichText; type: "blockquote" }
  | {
      alt: BlogArticleCopy;
      caption?: BlogArticleCopy;
      height: number;
      src: string;
      type: "image";
      width: number;
    }
  | {
      columns: readonly BlogArticleRichText[];
      label: BlogArticleCopy;
      rows: readonly (readonly BlogArticleRichText[])[];
      type: "table";
    };

/**
 * A blog article as its page renders it: its blocks, metadata and cover image,
 * in one language.
 */
export interface BlogPostArticle {
  blocks: readonly BlogArticleBlock[];
  category: BlogArticleCopy;
  date: BlogArticleCopy;
  dateTime: string;
  description: BlogArticleCopy;
  imageAlt: BlogArticleCopy;
  imageHeight: number;
  imageSrc: string;
  imageWidth: number;
  locale: "en" | "he";
  slug: string;
  status: "published";
  title: BlogArticleCopy;
  translationGroupId: string;
}

const copy =
  (value: string): BlogArticleCopy =>
  () =>
    value;

const richText = (value: string): BlogArticleRichText => [
  { copy: copy(value), type: "text" },
];

const categoryCopy = {
  business: blog_category_business,
  guides: blog_category_guides,
  news: blog_category_news,
} as const;

/**
 * A database article as its page renders it: its sections as blocks, each
 * section's image placed where the section names it.
 *
 * @param article - The article as read from the database.
 * @returns The article for its page.
 */
export const toBlogPostArticle = (
  article: DatabaseBlogPost
): BlogPostArticle => ({
  blocks: article.content.flatMap((section): BlogArticleBlock[] => {
    const contextualImage = article.images.find(
      (image) =>
        image.role === "context" && image.position === section.imagePosition
    );

    // Sections place images at positions 1 to 3 (the article generator's
    // contract), matching image_alt_texts' context keys.
    const contextAlt = new Map(Object.entries(article.image_alt_texts)).get(
      `context${section.imagePosition}`
    );

    return [
      {
        id: section.id,
        level: 2,
        text: copy(section.heading),
        type: "heading",
      },
      ...section.paragraphs.map((paragraph): BlogArticleBlock => ({
        content: richText(paragraph),
        type: "paragraph",
      })),
      ...(contextualImage
        ? [
            {
              alt: copy(contextAlt ?? article.title),
              height: contextualImage.height,
              src: getBlogImageUrl(contextualImage.storage_path),
              type: "image" as const,
              width: contextualImage.width,
            },
          ]
        : []),
      ...(section.bullets.length > 0
        ? [
            {
              items: section.bullets.map(richText),
              type: "list" as const,
            },
          ]
        : []),
    ];
  }),
  category: categoryCopy[article.category_key],
  date: copy(
    new Intl.DateTimeFormat(article.locale === "he" ? "he-IL" : "en-US", {
      dateStyle: "long",
    }).format(new Date(article.published_at))
  ),
  dateTime: article.published_at,
  description: copy(article.description),
  imageAlt: copy(article.image_alt_texts.hero ?? article.title),
  imageHeight: 768,
  imageSrc: article.imageSrc,
  imageWidth: 1344,
  locale: article.locale,
  slug: article.slug,
  status: "published",
  title: copy(article.title),
  translationGroupId: article.translation_group_id,
});
