type AnalyticsEventParameter = boolean | number | string;

type AnalyticsEventParameters = Record<string, AnalyticsEventParameter>;

type AnalyticsConsentState = "denied" | "granted";

declare global {
  interface Window {
    gtag?: {
      (
        command: "event",
        eventName: string,
        parameters?: AnalyticsEventParameters
      ): void;
      (
        command: "consent",
        action: "update",
        parameters: { analytics_storage: AnalyticsConsentState }
      ): void;
    };
  }
}

/**
 * Sends one Google Analytics event, when the tag is loaded; nothing during
 * server rendering.
 *
 * @param eventName - The event's name.
 * @param parameters - Its non-personal parameters.
 */
export const trackAnalyticsEvent = (
  eventName: string,
  parameters?: AnalyticsEventParameters
) => {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("event", eventName, parameters);
};

/**
 * Google Consent Mode: the tag starts with analytics_storage denied (see the
 * bootstrap in routes/__root.tsx) and measures only after the visitor
 * accepts the cookie banner.
 *
 * @param granted - Whether the visitor accepted analytics.
 */
export const updateAnalyticsConsent = (granted: boolean) => {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
  });
};
