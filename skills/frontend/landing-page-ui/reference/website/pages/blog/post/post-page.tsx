import { ArrowLeft01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { domMax, LazyMotion, useReducedMotion } from "motion/react";
import { a as MotionA, span as MotionSpan } from "motion/react-m";
import { useEffect, useRef, useState } from "react";

import { blog_article_author, blog_article_back } from "#/paraglide/messages";
import { getLocale, getTextDirection, localizeHref } from "#/paraglide/runtime";

import { backNavigationStyles } from "../../../shared/layout/page/back-navigation.styles";
import { AnimatedTitleText } from "../../../shared/motion/animated-title-text";
import {
  ScrollReveal,
  ScrollRevealSeparator,
} from "../../../shared/motion/scroll-reveal";
import { trackAnalyticsEvent } from "../../../shared/site/google-analytics";
import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import type { BlogArticleBlock, BlogPostArticle } from "../data/articles";
import { BlogCta } from "../page/blog-cta";
import { BlogImagePreview } from "./blog-image-preview";
import { BlogPostContent } from "./blog-post-content";
import { BlogPostOnThisPage } from "./blog-post-on-this-page";
import { blogPostPageStyles as styles } from "./post-page.styles";
import { splitHeadingEmphasis } from "./split-heading-emphasis";

const isBlogArticleHeading = (
  block: BlogArticleBlock
): block is Extract<BlogArticleBlock, { type: "heading" }> =>
  block.type === "heading";

/**
 * A blog post's page: its title and date, the article's blocks, and its table
 * of contents following the heading in view.
 *
 * @param props - article: the article.
 * @returns The page.
 */
export const BlogPostPage = ({ article }: { article: BlogPostArticle }) => {
  const trackedArticleSlugRef = useRef<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const headings = article.blocks.filter(isBlogArticleHeading);

  const [activeHeadingId, setActiveHeadingId] = useState(
    () => headings.at(0)?.id ?? ""
  );

  const iconHoverTransform =
    getTextDirection() === "rtl" ? "translateX(2px)" : "translateX(-2px)";

  const title = article.title();
  const titleParts = splitHeadingEmphasis(title);

  useEffect(() => {
    if (trackedArticleSlugRef.current === article.slug) {
      return;
    }

    trackedArticleSlugRef.current = article.slug;
    trackAnalyticsEvent("blog_article_opened", {
      article_slug: article.slug,
      locale: getLocale(),
    });
  }, [article.slug]);

  return (
    <LazyMotion features={domMax} strict>
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <section className={styles.headerSection}>
          <div className={styles.inner}>
            <div>
              <ScrollReveal>
                <MotionA
                  href={localizeHref("/blog")}
                  initial="rest"
                  whileHover="hover"
                  className={cn(
                    typography.marketingBodyCompact,
                    backNavigationStyles.link,
                    styles.backLink
                  )}
                >
                  <MotionSpan
                    aria-hidden="true"
                    transition={{
                      damping: 24,
                      stiffness: 450,
                      type: "spring",
                    }}
                    variants={{
                      hover: {
                        transform:
                          prefersReducedMotion === true
                            ? "translateX(0)"
                            : iconHoverTransform,
                      },
                      rest: { transform: "translateX(0)" },
                    }}
                    className={styles.backIcon}
                  >
                    <span className={backNavigationStyles.glyph}>
                      <HugeiconsIcon
                        icon={ArrowLeft01Icon}
                        size={16}
                        strokeWidth={1.5}
                      />
                    </span>
                  </MotionSpan>
                  {blog_article_back()}
                </MotionA>
              </ScrollReveal>
              <ScrollReveal>
                <h1
                  className={cn(typography.marketingDisplayTitle, styles.title)}
                >
                  <AnimatedTitleText
                    lines={[
                      {
                        segments: [
                          { text: titleParts.lead },
                          {
                            className: styles.titleAccent,
                            text: ` ${titleParts.emphasized}`,
                          },
                        ],
                      },
                    ]}
                  />
                </h1>
              </ScrollReveal>
            </div>
            <ScrollReveal>
              <div className={styles.postDetails}>
                <div className={styles.author}>
                  <span className={styles.authorAvatar}>
                    <img
                      alt=""
                      height={16}
                      src="/brand/app-logo.webp"
                      width={16}
                      className={styles.authorImage}
                    />
                  </span>
                  <p className={styles.authorName}>{blog_article_author()}</p>
                  <span aria-hidden="true" className={styles.separator}>
                    •
                  </span>
                  <time dateTime={article.dateTime} className={styles.date}>
                    {article.date()}
                  </time>
                </div>
                <div className={styles.categories}>
                  <p className={styles.category}>{article.category()}</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className={styles.postSection}>
          <div className={styles.inner}>
            <div className={styles.postGrid}>
              <BlogPostOnThisPage
                activeHeadingId={activeHeadingId}
                headings={headings}
              />
              <article className={cn(typography.body, styles.article)}>
                <ScrollReveal>
                  <BlogImagePreview
                    alt={article.imageAlt()}
                    fetchPriority="high"
                    height={article.imageHeight}
                    imageClassName={styles.heroImage}
                    src={article.imageSrc}
                    triggerClassName={styles.heroFrame}
                    width={article.imageWidth}
                  />
                </ScrollReveal>
                <ScrollRevealSeparator className={styles.innerDivider} />
                <BlogPostContent
                  blocks={article.blocks}
                  onHeadingInView={setActiveHeadingId}
                />
              </article>
            </div>
          </div>
        </section>

        <BlogCta />
      </main>
    </LazyMotion>
  );
};
