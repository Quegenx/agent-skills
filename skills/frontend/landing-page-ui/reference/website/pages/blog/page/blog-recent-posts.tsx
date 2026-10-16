import { AnimatePresence, useReducedMotion } from "motion/react";
import { div as MotionDiv, p as MotionP } from "motion/react-m";
import { useEffect, useState } from "react";

import { blog_no_posts } from "#/paraglide/messages";

import { ScrollReveal } from "../../../shared/motion/scroll-reveal";
import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import type { BlogPost } from "../data/posts";
import { blogPostStyles as styles } from "../post/blog-post.styles";
import { BlogRecentPost } from "./post-card";

const useBlogViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight((currentHeight) =>
        currentHeight === 0 || window.innerWidth > 920
          ? window.innerHeight
          : currentHeight
      );
    };

    // The page's box resizes with the window; it reports once at the start.
    const observer = new ResizeObserver(updateViewportHeight);
    observer.observe(document.documentElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return viewportHeight;
};

interface BlogRecentPostsProps {
  posts: readonly BlogPost[];
}

/**
 * The blog's recent posts, stacking in as the page scrolls.
 *
 * @param props - posts: the posts to show.
 * @returns The posts list.
 */
export const BlogRecentPosts = ({ posts }: BlogRecentPostsProps) => {
  const prefersReducedMotion = useReducedMotion();
  const viewportHeight = useBlogViewportHeight();
  const staggerStep = Math.min(34.28 / viewportHeight, 0.175);

  return (
    <div className={styles.postsContainer}>
      <div className={styles.postsStack}>
        <AnimatePresence mode="popLayout">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <MotionDiv
                animate={{
                  opacity: 1,
                  transition: {
                    delay:
                      prefersReducedMotion === true
                        ? 0
                        : (Math.floor(index / 2) + 1) * staggerStep * 1.5,
                    duration: prefersReducedMotion === true ? 0 : 0.3,
                    ease: "easeOut",
                  },
                }}
                exit={{
                  opacity: 0,
                  pointerEvents: "none",
                  transition: {
                    delay:
                      prefersReducedMotion === true
                        ? 0
                        : (Math.floor(index / 2) + 1) * staggerStep * 0.75,
                    duration: prefersReducedMotion === true ? 0 : 0.15,
                    ease: "easeOut",
                  },
                }}
                initial={{ opacity: prefersReducedMotion === true ? 1 : 0 }}
                key={post.slug}
                layoutId={prefersReducedMotion === true ? undefined : post.slug}
              >
                <ScrollReveal>
                  <BlogRecentPost post={post} />
                </ScrollReveal>
              </MotionDiv>
            ))
          ) : (
            <MotionP
              animate={{ opacity: 1, transform: "scale(1)" }}
              exit={{ opacity: 0, transform: "scale(0.96)" }}
              initial={{ opacity: 0, transform: "scale(0.96)" }}
              key="no-posts"
              transition={
                prefersReducedMotion === true
                  ? { duration: 0 }
                  : { duration: 0.7, ease: [0.19, 1, 0.22, 1] }
              }
              className={cn(typography.marketingBodyCompact, styles.noPosts)}
            >
              {blog_no_posts()}
            </MotionP>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
