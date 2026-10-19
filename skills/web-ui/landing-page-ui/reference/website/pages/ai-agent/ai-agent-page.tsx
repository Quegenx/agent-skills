import { MarketingMotionPage } from "../../shared/layout/page/marketing-motion-page";
import { AiAgentCta } from "./ai-agent-cta";
import { AiAgentFaqs } from "./ai-agent-faqs";
import { AiAgentHero } from "./ai-agent-hero";
import { aiAgentPageStyles as styles } from "./ai-agent-page.styles";
import { AiAgentStory } from "./ai-agent-story";

/**
 * The AI agent marketing page: hero, story, FAQs and the closing call to
 * action.
 *
 * @returns The page.
 */
export const AiAgentPage = () => (
  <MarketingMotionPage className={styles.main}>
    <AiAgentHero />
    <AiAgentStory />
    <AiAgentFaqs />
    <AiAgentCta />
  </MarketingMotionPage>
);
