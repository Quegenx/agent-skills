import { useInView } from "motion/react";
import { useEffect, useRef } from "react";

import { articleProseStyles } from "../../../shared/layout/content/article-prose.styles";
import { AnimatedSectionHeadingText } from "../../../shared/motion/animated-section-heading-text";
import { ScrollReveal } from "../../../shared/motion/scroll-reveal";
import { sectionNavigationInViewOptions } from "../../../shared/navigation/section-navigation-observer";
import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import type { BlogArticleBlock } from "../data/articles";
import { BlogArticleInlineText } from "./blog-article-inline-text";
import { BlogArticleList } from "./blog-article-list";
import { BlogArticleTable } from "./blog-article-table";
import { BlogImagePreview } from "./blog-image-preview";
import { blogPostProseStyles as styles } from "./blog-post-prose.styles";
import { getRichTextKey } from "./blog-rich-text-key";
import { splitHeadingEmphasis } from "./split-heading-emphasis";

const BlogArticleHeading = ({
  block,
  onHeadingInView,
}: {
  block: Extract<BlogArticleBlock, { type: "heading" }>;
  onHeadingInView: (headingId: string) => void;
}) => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isInView = useInView(headingRef, sectionNavigationInViewOptions);
  const headingText = block.text();
  const headingParts = splitHeadingEmphasis(headingText);

  useEffect(() => {
    if (isInView) {
      onHeadingInView(block.id);
    }
  }, [block.id, isInView, onHeadingInView]);

  if (block.level === 3) {
    return (
      <h3
        id={block.id}
        ref={headingRef}
        className={cn(
          typography.heading3,
          articleProseStyles.sectionHeadingSpacing,
          styles.heading,
          styles.headingThree
        )}
      >
        {block.text()}
      </h3>
    );
  }

  if (block.level === 4) {
    return (
      <h4
        id={block.id}
        ref={headingRef}
        className={cn(
          typography.marketingContentTitle,
          articleProseStyles.sectionHeadingSpacing,
          styles.heading,
          styles.headingFour
        )}
      >
        {block.text()}
      </h4>
    );
  }

  return (
    <h2
      id={block.id}
      ref={headingRef}
      className={cn(
        typography.heading2,
        articleProseStyles.sectionHeadingSpacing,
        styles.heading,
        styles.headingTwo
      )}
    >
      <AnimatedSectionHeadingText
        mutedText={headingParts.emphasized}
        text={headingText}
      />
    </h2>
  );
};

/**
 * An article's blocks as the page shows them, each revealed on scroll; headings
 * report when they come into view.
 *
 * @param props - blocks: the article's blocks; onHeadingInView: told the
 *   heading now in view.
 * @returns The rendered blocks.
 */
export const BlogPostContent = ({
  blocks,
  onHeadingInView,
}: {
  blocks: readonly BlogArticleBlock[];
  onHeadingInView: (headingId: string) => void;
}) => (
  <>
    {blocks.map((block) => {
      if (block.type === "heading") {
        return (
          <ScrollReveal key={block.id}>
            <BlogArticleHeading
              block={block}
              onHeadingInView={onHeadingInView}
            />
          </ScrollReveal>
        );
      }

      if (block.type === "list") {
        return (
          <ScrollReveal key={block.items.map(getRichTextKey).join("-")}>
            <BlogArticleList block={block} />
          </ScrollReveal>
        );
      }

      if (block.type === "table") {
        return (
          <ScrollReveal key={block.label()}>
            <BlogArticleTable block={block} />
          </ScrollReveal>
        );
      }

      if (block.type === "blockquote") {
        return (
          <ScrollReveal key={getRichTextKey(block.content)}>
            <blockquote className={styles.blockquote}>
              <BlogArticleInlineText content={block.content} />
            </blockquote>
          </ScrollReveal>
        );
      }

      if (block.type === "image") {
        return (
          <ScrollReveal key={block.src}>
            <figure className={styles.imageFigure}>
              <BlogImagePreview
                alt={block.alt()}
                height={block.height}
                imageClassName={styles.image}
                loading="lazy"
                src={block.src}
                triggerClassName={styles.imageTrigger}
                width={block.width}
              />
              {block.caption ? (
                <figcaption
                  className={cn(typography.caption, styles.imageCaption)}
                >
                  {block.caption()}
                </figcaption>
              ) : null}
            </figure>
          </ScrollReveal>
        );
      }

      return (
        <ScrollReveal key={getRichTextKey(block.content)}>
          <p
            className={cn(
              typography.body,
              articleProseStyles.body,
              articleProseStyles.flowBlock
            )}
          >
            <BlogArticleInlineText content={block.content} />
          </p>
        </ScrollReveal>
      );
    })}
  </>
);
