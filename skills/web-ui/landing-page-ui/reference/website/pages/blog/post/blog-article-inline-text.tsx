import { Fragment } from "react";

import { localizeHref } from "#/paraglide/runtime";

import { inlineContentLinkStyles } from "../../../shared/layout/content/inline-content-link.styles";
import type { BlogArticleRichText } from "../data/articles";
import { blogPostProseStyles as styles } from "./blog-post-prose.styles";
import { getInlineKey } from "./blog-rich-text-key";

/**
 * An article's rich text as React elements: links, code, emphasis, strong text
 * and line breaks.
 *
 * @param props - content: the rich text.
 * @returns The elements.
 */
export const BlogArticleInlineText = ({
  content,
}: {
  content: BlogArticleRichText;
}) => (
  <>
    {content.map((inline) => {
      const key = getInlineKey(inline);

      if (inline.type === "break") {
        return <br key={key} />;
      }

      if (inline.type === "strong") {
        return (
          <strong key={key} className={styles.strong}>
            {inline.copy()}
          </strong>
        );
      }

      if (inline.type === "emphasis") {
        return <em key={key}>{inline.copy()}</em>;
      }

      if (inline.type === "code") {
        return (
          <code key={key} className={styles.code}>
            {inline.copy()}
          </code>
        );
      }

      if (inline.type === "link") {
        return (
          <a
            href={
              inline.external === true ? inline.href : localizeHref(inline.href)
            }
            key={key}
            rel={inline.external === true ? "noopener noreferrer" : undefined}
            target={inline.external === true ? "_blank" : undefined}
            className={inlineContentLinkStyles.link}
          >
            {inline.copy()}
          </a>
        );
      }

      return <Fragment key={key}>{inline.copy()}</Fragment>;
    })}
  </>
);
