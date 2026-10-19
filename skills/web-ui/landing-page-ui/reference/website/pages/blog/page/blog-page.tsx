import { useLoaderData } from "@tanstack/react-router";
import { useLenis } from "lenis/react";
import { useState } from "react";

import {
  blog_recent_posts,
  blog_recent_posts_muted,
} from "#/paraglide/messages";

import { MarketingMotionPage } from "../../../shared/layout/page/marketing-motion-page";
import { marketingPageStyles } from "../../../shared/layout/page/marketing-page.styles";
import { AnimatedSectionHeadingText } from "../../../shared/motion/animated-section-heading-text";
import {
  ScrollReveal,
  ScrollRevealSeparator,
} from "../../../shared/motion/scroll-reveal";
import { layouts } from "../../../shared/styles/layouts";
import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import type { BlogCategory, BlogPost } from "../data/posts";
import { BlogCategorySelect } from "./blog-category-select";
import { BlogCta } from "./blog-cta";
import { BlogHero } from "./blog-hero";
import { blogPageStyles as styles } from "./blog-page.styles";
import { BlogPagination } from "./blog-pagination";
import { BlogRecentPosts } from "./blog-recent-posts";
import { BlogFeaturedPost } from "./post-card";

const postsPerPage = 4;

/**
 * The blog's index page: the featured post, then the recent posts by category,
 * a page at a time.
 *
 * @returns The page.
 */
export const BlogPage = () => {
  const databasePosts = useLoaderData({ from: "/(website)/blog" });
  const lenis = useLenis();
  const [category, setCategory] = useState<BlogCategory>("all");
  const [page, setPage] = useState(1);

  const posts = databasePosts.map((post): BlogPost => ({
    category: post.category_key,
    description: post.excerpt,
    href: `/blog/${post.slug}`,
    imageAlt: post.image_alt_texts.hero ?? post.title,
    imageHeight: 768,
    imageSrc: post.imageSrc,
    imageWidth: 1344,
    slug: post.slug,
    title: post.title,
  }));

  const featuredPost = posts.at(0);
  const recentPosts = posts.slice(1);

  const filteredPosts =
    category === "all"
      ? recentPosts
      : recentPosts.filter((post) => post.category === category);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const visiblePosts = filteredPosts.slice(
    (page - 1) * postsPerPage,
    page * postsPerPage
  );

  const handleCategoryChange = (nextCategory: BlogCategory) => {
    setCategory(nextCategory);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    requestAnimationFrame(() => {
      const recentPostsSection =
        document.querySelector<HTMLElement>("#blog-recent-posts");

      if (!recentPostsSection) {
        return;
      }

      if (lenis) {
        lenis.resize();
        lenis.scrollTo(recentPostsSection, {
          force: true,
          immediate: true,
        });

        return;
      }

      // Stops below the header: scrollIntoView keeps the section's
      // scroll-margin-top.
      recentPostsSection.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    });
  };

  return (
    <MarketingMotionPage className={styles.main}>
      <BlogHero />

      {featuredPost ? (
        <section
          data-alternate-styling="false"
          data-full-width="false"
          className={cn(
            layouts.centeredColumn,
            layouts.sectionBlockPadding,
            marketingPageStyles.section,
            styles.featuredSection
          )}
        >
          <div className={cn(layouts.contentNarrow, styles.featuredContent)}>
            <ScrollReveal>
              <BlogFeaturedPost post={featuredPost} />
            </ScrollReveal>
          </div>
        </section>
      ) : null}

      {recentPosts.length > 0 ? (
        <>
          <ScrollRevealSeparator className={styles.divider} />
          <section
            data-alternate-styling="false"
            data-full-width="false"
            id="blog-recent-posts"
            className={cn(
              layouts.centeredColumn,
              layouts.sectionBlockPadding,
              marketingPageStyles.section,
              styles.recentSection
            )}
          >
            <div className={layouts.contentNarrow}>
              <div className={styles.postsHeader}>
                <ScrollReveal>
                  <h2
                    className={cn(
                      typography.marketingSectionHeading,
                      styles.postsHeaderTitle
                    )}
                  >
                    <AnimatedSectionHeadingText
                      mutedText={blog_recent_posts_muted()}
                      text={blog_recent_posts()}
                    />
                  </h2>
                </ScrollReveal>
                <ScrollReveal>
                  <BlogCategorySelect
                    onChange={handleCategoryChange}
                    value={category}
                  />
                </ScrollReveal>
              </div>
              <BlogRecentPosts posts={visiblePosts} />
              <ScrollReveal viewportAmount={0.1}>
                <BlogPagination
                  currentPage={page}
                  onPageChange={handlePageChange}
                  totalPages={totalPages}
                />
              </ScrollReveal>
            </div>
          </section>
        </>
      ) : null}

      <BlogCta />
    </MarketingMotionPage>
  );
};
