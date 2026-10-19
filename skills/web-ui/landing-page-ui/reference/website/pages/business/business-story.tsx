import {
  business_accounts_body,
  business_accounts_title,
  business_competitors_body,
  business_competitors_title,
  business_find_description,
  business_find_title,
  business_find_title_muted,
  business_flow_description,
  business_flow_step_find,
  business_flow_step_handle,
  business_flow_step_reply,
  business_flow_title,
  business_flow_title_muted,
  business_groups_body,
  business_groups_title,
  business_more_description,
  business_more_title,
  business_more_title_muted,
  business_problem_description,
  business_problem_panel_body,
  business_problem_panel_title,
  business_problem_title,
  business_problem_title_muted,
  business_profile_description,
  business_profile_option_areas,
  business_profile_option_not_relevant,
  business_profile_option_offer,
  business_profile_option_style,
  business_profile_title,
  business_profile_title_muted,
  business_tasks_body,
  business_tasks_title,
} from "#/paraglide/messages";

import { productScreens } from "../../shared/site/product-screens";
import {
  MarketingFlowPanel,
  MarketingOptionsPanel,
  MarketingStoryCard,
  MarketingStorySection,
  MarketingStoryPanel,
} from "../../widgets/marketing-story/marketing-story";
import { marketingStoryStyles as styles } from "../../widgets/marketing-story/marketing-story.styles";

/**
 * The business page's story: the problem, then how App finds customers
 * in groups.
 *
 * @returns The story sections.
 */
export const BusinessStory = () => (
  <>
    <MarketingStorySection
      description={business_problem_description()}
      mutedText={business_problem_title_muted()}
      title={business_problem_title()}
    >
      <MarketingStoryPanel
        body={business_problem_panel_body()}
        screen={productScreens.opportunities}
        title={business_problem_panel_title()}
      />
    </MarketingStorySection>
    <MarketingStorySection
      description={business_find_description()}
      mutedText={business_find_title_muted()}
      title={business_find_title()}
    >
      <div className={styles.twoColumnGrid}>
        <MarketingStoryCard
          body={business_groups_body()}
          screen={productScreens.groupSearch}
          title={business_groups_title()}
        />
        <MarketingStoryCard
          body={business_tasks_body()}
          screen={productScreens.tasks}
          title={business_tasks_title()}
        />
      </div>
    </MarketingStorySection>
    <MarketingStorySection
      description={business_profile_description()}
      mutedText={business_profile_title_muted()}
      title={business_profile_title()}
      className={styles.alternateSection}
    >
      <MarketingOptionsPanel
        screen={productScreens.preferences}
        options={[
          business_profile_option_offer(),
          business_profile_option_areas(),
          business_profile_option_not_relevant(),
          business_profile_option_style(),
        ]}
      />
    </MarketingStorySection>
    <MarketingStorySection
      description={business_flow_description()}
      mutedText={business_flow_title_muted()}
      title={business_flow_title()}
    >
      <MarketingFlowPanel
        screen={productScreens.posts}
        steps={[
          business_flow_step_find(),
          business_flow_step_handle(),
          business_flow_step_reply(),
        ]}
      />
    </MarketingStorySection>
    <MarketingStorySection
      description={business_more_description()}
      mutedText={business_more_title_muted()}
      title={business_more_title()}
      className={styles.alternateSection}
    >
      <div className={styles.twoColumnGrid}>
        <MarketingStoryCard
          body={business_competitors_body()}
          screen={productScreens.adLibrary}
          onGray
          title={business_competitors_title()}
        />
        <MarketingStoryCard
          body={business_accounts_body()}
          screen={productScreens.facebookAccounts}
          onGray
          title={business_accounts_title()}
        />
      </div>
    </MarketingStorySection>
  </>
);
