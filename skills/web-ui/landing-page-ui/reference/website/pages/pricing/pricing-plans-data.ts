import {
  pricing_plan_business_audience,
  pricing_plan_business_badge,
  pricing_plan_business_feature_competitors,
  pricing_plan_business_feature_everything,
  pricing_plan_business_feature_leads,
  pricing_plan_business_feature_profile,
  pricing_plan_business_name,
  pricing_plan_personal_audience,
  pricing_plan_personal_feature_account,
  pricing_plan_personal_feature_agent,
  pricing_plan_personal_feature_alerts,
  pricing_plan_personal_feature_groups,
  pricing_plan_personal_feature_posts,
  pricing_plan_personal_feature_tasks,
  pricing_plan_personal_name,
  pricing_plan_pro_audience,
  pricing_plan_pro_feature_accounts,
  pricing_plan_pro_feature_everything,
  pricing_plan_pro_name,
} from "#/paraglide/messages";

/**
 * An app plan as the pricing page shows it: who it is for, its
 * features, name, monthly price in shekels, and the recommended badge.
 */
export interface PricingPlan {
  audience: string;
  // Shown on the plan the page recommends.
  badge?: string;
  features: readonly string[];
  id: "business" | "personal" | "pro";
  name: string;
  // Monthly, in shekels.
  price: number;
}

/**
 * The three App plans. Payment is not open yet, and the app does not
 * enforce plan limits yet: these are the plans as they will be sold.
 *
 * @returns The plans, in the page's language.
 */
export const getPricingPlans = (): readonly PricingPlan[] => [
  {
    audience: pricing_plan_personal_audience(),
    features: [
      pricing_plan_personal_feature_agent(),
      pricing_plan_personal_feature_groups(),
      pricing_plan_personal_feature_posts(),
      pricing_plan_personal_feature_tasks(),
      pricing_plan_personal_feature_alerts(),
      pricing_plan_personal_feature_account(),
    ],
    id: "personal",
    name: pricing_plan_personal_name(),
    price: 99,
  },
  {
    audience: pricing_plan_business_audience(),
    badge: pricing_plan_business_badge(),
    features: [
      pricing_plan_business_feature_everything(),
      pricing_plan_business_feature_leads(),
      pricing_plan_business_feature_profile(),
      pricing_plan_business_feature_competitors(),
    ],
    id: "business",
    name: pricing_plan_business_name(),
    price: 299,
  },
  {
    audience: pricing_plan_pro_audience(),
    features: [
      pricing_plan_pro_feature_everything(),
      pricing_plan_pro_feature_accounts(),
    ],
    id: "pro",
    name: pricing_plan_pro_name(),
    price: 699,
  },
];
