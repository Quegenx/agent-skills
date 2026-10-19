import { createFileRoute } from "@tanstack/react-router";

import {
  monitoring_meta_description,
  monitoring_meta_title,
} from "#/paraglide/messages";

import { getMonitoringFaqItems } from "../../website/pages/monitoring/monitoring-faqs-data";
import { MonitoringPage } from "../../website/pages/monitoring/monitoring-page";
import { getFaqPageStructuredData } from "../../website/shared/layout/page/faq-page-json-ld";
import { getMarketingPageHead } from "../../website/shared/layout/page/marketing-page-head";

export const Route = createFileRoute("/(website)/monitoring")({
  component: MonitoringPage,
  head: () => {
    const pageHead = getMarketingPageHead({
      description: monitoring_meta_description(),
      path: "/monitoring",
      title: monitoring_meta_title(),
    });

    return {
      ...pageHead,
      scripts: [
        ...pageHead.scripts,
        getFaqPageStructuredData("/monitoring", getMonitoringFaqItems()),
      ],
    };
  },
});
