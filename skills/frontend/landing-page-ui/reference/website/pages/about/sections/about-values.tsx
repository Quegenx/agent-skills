import {
  about_value_approval_description,
  about_value_approval_title,
  about_value_signal_description,
  about_value_signal_title,
  about_value_ownership_description,
  about_value_ownership_title,
  about_value_improvement_description,
  about_value_improvement_title,
  about_values_description,
  about_values_title,
  about_values_title_muted,
} from "#/paraglide/messages";

import { productScreens } from "../../../shared/site/product-screens";
import {
  MarketingStoryCard,
  MarketingStorySection,
} from "../../../widgets/marketing-story/marketing-story";
import { marketingStoryStyles as styles } from "../../../widgets/marketing-story/marketing-story.styles";

/**
 * The about page's values section, a card for each value with its screen.
 *
 * @returns The section.
 */
export const AboutValues = () => (
  <MarketingStorySection
    description={about_values_description()}
    mutedText={about_values_title_muted()}
    title={about_values_title()}
  >
    <div className={styles.twoColumnGrid}>
      <MarketingStoryCard
        body={about_value_signal_description()}
        screen={productScreens.posts}
        title={about_value_signal_title()}
      />
      <MarketingStoryCard
        body={about_value_ownership_description()}
        screen={productScreens.memory}
        title={about_value_ownership_title()}
      />
      <MarketingStoryCard
        body={about_value_improvement_description()}
        screen={productScreens.tasks}
        title={about_value_improvement_title()}
      />
      <MarketingStoryCard
        body={about_value_approval_description()}
        screen={productScreens.agentJoinApproval}
        title={about_value_approval_title()}
      />
    </div>
  </MarketingStorySection>
);
