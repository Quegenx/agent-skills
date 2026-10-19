import {
  blog_category_all,
  blog_category_business,
  blog_category_guides,
  blog_category_news,
} from "#/paraglide/messages";
import type { LocalizedString } from "#/paraglide/runtime";

/**
 * A blog category, or all of them.
 */
export type BlogCategory = "all" | "business" | "guides" | "news";

type BlogCopy = () => LocalizedString;

/**
 * A blog post as its card shows it: its category, title, description, link and
 * image.
 */
export interface BlogPost {
  category: Exclude<BlogCategory, "all">;
  description: string;
  href: string;
  imageAlt: string;
  imageHeight: number;
  imageSrc: string;
  imageWidth: number;
  slug: string;
  title: string;
}

export const blogCategories = [
  { id: "all", label: blog_category_all },
  { id: "news", label: blog_category_news },
  { id: "guides", label: blog_category_guides },
  { id: "business", label: blog_category_business },
] as const satisfies readonly { id: BlogCategory; label: BlogCopy }[];
