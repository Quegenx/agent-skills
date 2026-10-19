import { createFileRoute, useLoaderData } from "@tanstack/react-router";

import { exitRouteNotFound } from "@/lib/route-not-found-exit";

import { getHelpTopic } from "../../website/pages/help/data/help-center-data";
import { HelpTopicPage } from "../../website/pages/help/topic/help-topic-page";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

const HelpTopicRoute = () => {
  const { slug } = useLoaderData({ from: "/(website)/help_/$topic" });
  const topic = getHelpTopic(slug);

  if (!topic) {
    return exitRouteNotFound();
  }

  return <HelpTopicPage topic={topic} />;
};

export const Route = createFileRoute("/(website)/help_/$topic")({
  component: HelpTopicRoute,
  loader: ({ params }) => {
    const topic = getHelpTopic(params.topic);

    if (!topic) {
      return exitRouteNotFound();
    }

    return { slug: topic.slug };
  },
  head: ({ loaderData }) => {
    const topic = loaderData ? getHelpTopic(loaderData.slug) : undefined;

    if (!topic) {
      return {};
    }

    return getMarketingPageHead({
      description: topic.metaDescription,
      path: `/help/${topic.slug}`,
      title: topic.title,
    });
  },
});
