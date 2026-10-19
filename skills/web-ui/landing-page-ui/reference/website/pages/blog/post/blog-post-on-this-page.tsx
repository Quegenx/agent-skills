import { blog_article_toc } from "#/paraglide/messages";

import { SideSectionNavigation } from "../../../shared/navigation/side-section-navigation";
import type { BlogArticleBlock } from "../data/articles";

type BlogArticleHeading = Extract<BlogArticleBlock, { type: "heading" }>;

/**
 * A blog post's table of contents: its headings, the one in view marked.
 *
 * @param props - headings: the article's headings; activeHeadingId: the heading
 *   in view.
 * @returns The navigation.
 */
export const BlogPostOnThisPage = ({
  activeHeadingId,
  headings,
}: {
  activeHeadingId: string;
  headings: readonly BlogArticleHeading[];
}) => (
  <SideSectionNavigation
    activeItemId={activeHeadingId}
    indicatorLayoutId="blog-section-indicator"
    items={headings.map((heading) => ({
      id: heading.id,
      label: heading.text(),
    }))}
    label={blog_article_toc()}
  />
);
