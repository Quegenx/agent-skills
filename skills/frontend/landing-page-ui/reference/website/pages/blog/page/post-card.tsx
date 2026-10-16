import { blog_featured_label } from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";

import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import type { BlogPost } from "../data/posts";
import { blogCategories } from "../data/posts";
import { blogPostStyles as styles } from "../post/blog-post.styles";

const getBlogPostCategory = (post: BlogPost) =>
  blogCategories.find((category) => category.id === post.category)?.label();

/**
 * The blog's featured post card: its image, category, title and description.
 *
 * @param props - post: the post.
 * @returns The card, linking to the post.
 */
export const BlogFeaturedPost = ({ post }: { post: BlogPost }) => (
  <a
    href={localizeHref(post.href)}
    className={cn(styles.postLink, styles.featuredPost)}
  >
    <span className={cn(styles.imageFrame, styles.featuredImageFrame)}>
      <img
        alt={post.imageAlt}
        height={post.imageHeight}
        src={post.imageSrc}
        width={post.imageWidth}
        className={styles.postImage}
      />
    </span>
    <div className={styles.featuredPostDetails}>
      <div className={styles.featuredLabels}>
        <span className={cn(typography.label, styles.featuredLabel)}>
          {blog_featured_label()}
        </span>
        <span className={cn(typography.label, styles.featuredCategory)}>
          {getBlogPostCategory(post)}
        </span>
      </div>
      <h2 className={cn(typography.marketingPageHeading, styles.featuredTitle)}>
        {post.title}
      </h2>
      <p
        className={cn(
          typography.marketingBodyCompact,
          styles.featuredDescription
        )}
      >
        {post.description}
      </p>
    </div>
  </a>
);

/**
 * A recent post card in the blog's list.
 *
 * @param props - post: the post.
 * @returns The card, linking to the post.
 */
export const BlogRecentPost = ({ post }: { post: BlogPost }) => (
  <a
    href={localizeHref(post.href)}
    className={cn(styles.postLink, styles.recentPost)}
  >
    <div className={cn(styles.imageFrame, styles.recentImageFrame)}>
      <img
        alt={post.imageAlt}
        height={post.imageHeight}
        loading="lazy"
        src={post.imageSrc}
        width={post.imageWidth}
        className={styles.postImage}
      />
    </div>
    <div className={styles.recentPostDetails}>
      <h2 className={cn(typography.marketingCardTitle, styles.recentPostTitle)}>
        {post.title}
      </h2>
      <p className={styles.recentPostDescription}>{post.description}</p>
      <div className={styles.postCategories}>
        <span className={styles.postCategory}>{getBlogPostCategory(post)}</span>
      </div>
    </div>
  </a>
);
