import {
  personal_flow_description,
  personal_flow_step_define,
  personal_flow_step_open,
  personal_flow_step_scan,
  personal_flow_title,
  personal_flow_title_muted,
  personal_groups_body,
  personal_groups_title,
  personal_matches_body,
  personal_matches_title,
  personal_problem_description,
  personal_problem_panel_body,
  personal_problem_panel_title,
  personal_problem_title,
  personal_problem_title_muted,
  personal_tools_description,
  personal_tools_title,
  personal_tools_title_muted,
  personal_uses_description,
  personal_uses_option_home,
  personal_uses_option_job,
  personal_uses_option_pro,
  personal_uses_option_secondhand,
  personal_uses_title,
  personal_uses_title_muted,
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
 * The personal page's story: the problem, then how App finds
 * apartments, jobs, cars and pros in groups.
 *
 * @returns The story sections.
 */
export const PersonalStory = () => (
  <>
    <MarketingStorySection
      description={personal_problem_description()}
      mutedText={personal_problem_title_muted()}
      title={personal_problem_title()}
    >
      <MarketingStoryPanel
        body={personal_problem_panel_body()}
        screen={productScreens.personalAgentChat}
        title={personal_problem_panel_title()}
      />
    </MarketingStorySection>
    <MarketingStorySection
      description={personal_uses_description()}
      mutedText={personal_uses_title_muted()}
      title={personal_uses_title()}
      className={styles.alternateSection}
    >
      <MarketingOptionsPanel
        screen={productScreens.personalOpportunities}
        options={[
          personal_uses_option_home(),
          personal_uses_option_job(),
          personal_uses_option_secondhand(),
          personal_uses_option_pro(),
        ]}
      />
    </MarketingStorySection>
    <MarketingStorySection
      description={personal_tools_description()}
      mutedText={personal_tools_title_muted()}
      title={personal_tools_title()}
    >
      <div className={styles.twoColumnGrid}>
        <MarketingStoryCard
          body={personal_groups_body()}
          screen={productScreens.groupSearch}
          title={personal_groups_title()}
        />
        <MarketingStoryCard
          body={personal_matches_body()}
          screen={productScreens.personalOpportunities}
          title={personal_matches_title()}
        />
      </div>
    </MarketingStorySection>
    <MarketingStorySection
      description={personal_flow_description()}
      mutedText={personal_flow_title_muted()}
      title={personal_flow_title()}
    >
      <MarketingFlowPanel
        screen={productScreens.personalTasks}
        steps={[
          personal_flow_step_define(),
          personal_flow_step_scan(),
          personal_flow_step_open(),
        ]}
      />
    </MarketingStorySection>
  </>
);
