import { articleProseStyles } from "../../../shared/layout/content/article-prose.styles";
import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import type { BlogArticleBlock } from "../data/articles";
import { BlogArticleInlineText } from "./blog-article-inline-text";
import { blogPostProseStyles as styles } from "./blog-post-prose.styles";
import { getRichTextKey } from "./blog-rich-text-key";

/**
 * An article's list, ordered or not, its items of rich text.
 *
 * @param props - block: the list block.
 * @returns The list.
 */
export const BlogArticleList = ({
  block,
}: {
  block: Extract<BlogArticleBlock, { type: "list" }>;
}) => {
  const items = block.items.map((item) => (
    <li key={getRichTextKey(item)} className={styles.listItem}>
      <BlogArticleInlineText content={item} />
    </li>
  ));

  if (block.ordered === true) {
    return (
      <ol
        className={cn(
          typography.body,
          articleProseStyles.body,
          articleProseStyles.flowBlock,
          styles.list,
          styles.orderedList
        )}
      >
        {items}
      </ol>
    );
  }

  return (
    <ul
      className={cn(
        typography.body,
        articleProseStyles.body,
        articleProseStyles.flowBlock,
        styles.list,
        styles.unorderedList
      )}
    >
      {items}
    </ul>
  );
};
