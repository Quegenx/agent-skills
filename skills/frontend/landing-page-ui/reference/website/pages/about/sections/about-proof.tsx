import {
  about_proof_goal_label,
  about_proof_groups_label,
  about_proof_opportunities_label,
  about_proof_title,
  about_proof_title_muted,
} from "#/paraglide/messages";

import { productScreens } from "../../../shared/site/product-screens";
import {
  MarketingFlowPanel,
  MarketingStorySection,
} from "../../../widgets/marketing-story/marketing-story";
import { marketingStoryStyles as styles } from "../../../widgets/marketing-story/marketing-story.styles";

// The steps from a goal to opportunities, in the current locale: messages
// resolve when called, so the list is read on each render.
const aboutProofSteps = () => [
  about_proof_goal_label(),
  about_proof_groups_label(),
  about_proof_opportunities_label(),
];

/**
 * The about page's proof section: the steps from a goal to groups to
 * opportunities, on the group search's screen.
 *
 * @returns The section.
 */
export const AboutProof = () => (
  <MarketingStorySection
    mutedText={about_proof_title_muted()}
    title={about_proof_title()}
    className={styles.alternateSection}
  >
    <MarketingFlowPanel
      screen={productScreens.groupSearch}
      steps={aboutProofSteps()}
    />
  </MarketingStorySection>
);
