import { createFileRoute } from "@tanstack/react-router";

import { blog_meta_description, blog_meta_title } from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";

import { blogCacheHeaders } from "../../website/pages/blog/data/blog-cache-policy";
import { fetchPublishedBlogPosts } from "../../website/pages/blog/data/blog-data";
import { BlogPage } from "../../website/pages/blog/page/blog-page";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(website)/blog")({
  component: BlogPage,
  loader: async () =>
    await fetchPublishedBlogPosts(getLocale() === "he" ? "he" : "en"),
  head: () =>
    getMarketingPageHead({
      description: blog_meta_description(),
      path: "/blog",
      title: blog_meta_title(),
    }),
  headers: () => blogCacheHeaders,
});
