import { createFileRoute } from "@tanstack/react-router";

import {
  ai_agent_meta_description,
  ai_agent_meta_title,
} from "#/paraglide/messages";

import { getAiAgentFaqItems } from "../../website/pages/ai-agent/ai-agent-faqs-data";
import { AiAgentPage } from "../../website/pages/ai-agent/ai-agent-page";
import { getFaqPageStructuredData } from "../../website/shared/layout/page/faq-page-json-ld";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(website)/ai-agent")({
  component: AiAgentPage,
  head: () => {
    const pageHead = getMarketingPageHead({
      description: ai_agent_meta_description(),
      path: "/ai-agent",
      title: ai_agent_meta_title(),
    });

    return {
      ...pageHead,
      scripts: [
        ...pageHead.scripts,
        getFaqPageStructuredData("/ai-agent", getAiAgentFaqItems()),
      ],
    };
  },
});
