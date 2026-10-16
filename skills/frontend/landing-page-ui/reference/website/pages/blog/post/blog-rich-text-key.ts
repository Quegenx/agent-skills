import type { BlogArticleInline, BlogArticleRichText } from "../data/articles";

/**
 * A stable React key for one piece of rich text.
 *
 * @param inline - The piece.
 * @returns The key.
 */
export const getInlineKey = (inline: BlogArticleInline) => {
  if (inline.type === "break") {
    return "line-break";
  }

  const href = inline.type === "link" ? inline.href : "";

  return `${inline.type}-${inline.copy()}-${href}`;
};

/**
 * A stable React key for a piece of rich text, from its pieces.
 *
 * @param content - The rich text.
 * @returns The key.
 */
export const getRichTextKey = (content: BlogArticleRichText) =>
  content.map(getInlineKey).join("-");
