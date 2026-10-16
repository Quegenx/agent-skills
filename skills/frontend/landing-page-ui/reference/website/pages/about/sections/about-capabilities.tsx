import {
  about_capabilities_card_agent_description,
  about_capabilities_card_agent_title,
  about_capabilities_card_monitoring_description,
  about_capabilities_card_monitoring_title,
  about_capabilities_card_competitors_description,
  about_capabilities_card_competitors_title,
  about_capabilities_title,
  about_capabilities_title_muted,
} from "#/paraglide/messages";

import { ScrollRevealSeparator } from "../../../shared/motion/scroll-reveal";
import { productScreens } from "../../../shared/site/product-screens";
import {
  MarketingReturnPanel,
  MarketingStoryCard,
  MarketingStorySection,
} from "../../../widgets/marketing-story/marketing-story";
import { marketingStoryStyles as styles } from "../../../widgets/marketing-story/marketing-story.styles";

/**
 * The about page's capabilities section: a card for each part of the product,
 * with its screen.
 *
 * @returns The section.
 */
export const AboutCapabilities = () => (
  <MarketingStorySection
    mutedText={about_capabilities_title_muted()}
    title={about_capabilities_title()}
    className={styles.alternateSection}
  >
    <div className={styles.twoColumnGrid}>
      <MarketingStoryCard
        body={about_capabilities_card_agent_description()}
        screen={productScreens.agentChat}
        onGray
        title={about_capabilities_card_agent_title()}
      />
      <MarketingStoryCard
        body={about_capabilities_card_monitoring_description()}
        screen={productScreens.opportunities}
        onGray
        title={about_capabilities_card_monitoring_title()}
      />
    </div>
    <ScrollRevealSeparator
      data-full-width="false"
      data-variant="primary"
      className={styles.returnDivider}
    />
    <MarketingReturnPanel
      body={about_capabilities_card_competitors_description()}
      screen={productScreens.adLibrary}
      title={about_capabilities_card_competitors_title()}
    />
  </MarketingStorySection>
);
