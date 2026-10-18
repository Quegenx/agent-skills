import { createFileRoute, useLoaderData } from "@tanstack/react-router";

import { getLocale } from "#/paraglide/runtime";
import { exitRouteNotFound } from "@/lib/route-not-found-exit";

import { toBlogPostArticle } from "../../website/pages/blog/data/articles";
import { blogCacheHeaders } from "../../website/pages/blog/data/blog-cache-policy";
import { fetchPublishedBlogArticle } from "../../website/pages/blog/data/blog-data";
import { BlogPostPage } from "../../website/pages/blog/post/post-page";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

const BlogPostRoute = () => {
  // The loader throws notFound for a missing article, so this one exists.
  const databaseArticle = useLoaderData({ from: "/(website)/blog_/$slug" });

  return <BlogPostPage article={toBlogPostArticle(databaseArticle)} />;
};

export const Route = createFileRoute("/(website)/blog_/$slug")({
  component: BlogPostRoute,
  loader: async ({ params }) => {
    const article = await fetchPublishedBlogArticle(
      getLocale() === "he" ? "he" : "en",
      params.slug
    );

    if (!article) {
      return exitRouteNotFound();
    }

    return article;
  },
  head: ({ loaderData }) => {
    const article = loaderData;

    if (!article) {
      return {};
    }

    return getMarketingPageHead({
      description: article.description,
      datePublished: article.published_at,
      image: article.imageSrc,
      imageAlt: article.image_alt_texts.hero ?? article.title,
      index: true,
      path: `/blog/${article.slug}`,
      title: article.title,
      type: "article",
    });
  },
  headers: () => blogCacheHeaders,
});
