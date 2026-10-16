import { cn } from "../../../shared/styles/site-class-merge";
import type { BlogArticleBlock } from "../data/articles";
import { BlogArticleInlineText } from "./blog-article-inline-text";
import { blogPostProseStyles as styles } from "./blog-post-prose.styles";
import { getRichTextKey } from "./blog-rich-text-key";

/**
 * An article's table, its header row and body rows of rich text.
 *
 * @param props - block: the table block.
 * @returns The table.
 */
export const BlogArticleTable = ({
  block,
}: {
  block: Extract<BlogArticleBlock, { type: "table" }>;
}) => (
  <div className={styles.tableWrapper}>
    <table aria-label={block.label()} className={styles.table}>
      <thead className={styles.tableHead}>
        <tr>
          {block.columns.map((column) => (
            <th
              key={getRichTextKey(column)}
              scope="col"
              className={styles.tableCell}
            >
              <BlogArticleInlineText content={column} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {block.rows.map((row) => (
          <tr key={row.map(getRichTextKey).join("-")}>
            {row.map((cell) => (
              <td
                key={getRichTextKey(cell)}
                className={cn(styles.tableCell, styles.tableBodyCell)}
              >
                <BlogArticleInlineText content={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
