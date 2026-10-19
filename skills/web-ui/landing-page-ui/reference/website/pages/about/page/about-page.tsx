import {
  about_story_description,
  about_story_lead,
  about_story_panel_title,
  about_story_title,
  about_story_title_muted,
} from "#/paraglide/messages";

import { MarketingMotionPage } from "../../../shared/layout/page/marketing-motion-page";
import { ScrollRevealSeparator } from "../../../shared/motion/scroll-reveal";
import { productScreens } from "../../../shared/site/product-screens";
import {
  MarketingStorySection,
  MarketingStoryPanel,
} from "../../../widgets/marketing-story/marketing-story";
import { AboutCapabilities } from "../sections/about-capabilities";
import { AboutCta } from "../sections/about-cta";
import { AboutHero } from "../sections/about-hero";
import { AboutProof } from "../sections/about-proof";
import { AboutValues } from "../sections/about-values";
import { aboutPageStyles as styles } from "./about-page.styles";

/**
 * The about page: hero, story, proof, values, capabilities and the closing call
 * to action.
 *
 * @returns The page.
 */
export const AboutPage = () => (
  <MarketingMotionPage className={styles.main}>
    <AboutHero />
    <ScrollRevealSeparator
      data-full-width="false"
      data-variant="primary"
      className={styles.divider}
    />
    <MarketingStorySection
      description={about_story_lead()}
      mutedText={about_story_title_muted()}
      title={about_story_title()}
    >
      <MarketingStoryPanel
        body={about_story_description()}
        screen={productScreens.opportunities}
        title={about_story_panel_title()}
      />
    </MarketingStorySection>
    <AboutProof />
    <AboutValues />
    <AboutCapabilities />
    <AboutCta />
  </MarketingMotionPage>
);
