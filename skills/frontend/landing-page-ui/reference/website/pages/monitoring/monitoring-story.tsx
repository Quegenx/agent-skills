import {
  monitoring_alerts_body,
  monitoring_alerts_title,
  monitoring_filters_description,
  monitoring_filters_option_area,
  monitoring_filters_option_not_relevant,
  monitoring_filters_option_repeats,
  monitoring_filters_option_scanned,
  monitoring_filters_title,
  monitoring_filters_title_muted,
  monitoring_flow_description,
  monitoring_flow_step_open,
  monitoring_flow_step_rank,
  monitoring_flow_step_scan,
  monitoring_flow_title,
  monitoring_flow_title_muted,
  monitoring_problem_description,
  monitoring_problem_panel_body,
  monitoring_problem_panel_title,
  monitoring_problem_title,
  monitoring_problem_title_muted,
  monitoring_tasks_body,
  monitoring_tasks_title,
  monitoring_tools_description,
  monitoring_tools_title,
  monitoring_tools_title_muted,
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
 * The monitoring page's story: the problem, then how tracking tasks keep
 * watching, filter what they find and alert on matches.
 *
 * @returns The story sections.
 */
export const MonitoringStory = () => (
  <>
    <MarketingStorySection
      description={monitoring_problem_description()}
      mutedText={monitoring_problem_title_muted()}
      title={monitoring_problem_title()}
    >
      <MarketingStoryPanel
        body={monitoring_problem_panel_body()}
        screen={productScreens.opportunities}
        title={monitoring_problem_panel_title()}
      />
    </MarketingStorySection>
    <MarketingStorySection
      description={monitoring_tools_description()}
      mutedText={monitoring_tools_title_muted()}
      title={monitoring_tools_title()}
    >
      <div className={styles.twoColumnGrid}>
        <MarketingStoryCard
          body={monitoring_tasks_body()}
          screen={productScreens.tasks}
          title={monitoring_tasks_title()}
        />
        <MarketingStoryCard
          body={monitoring_alerts_body()}
          screen={productScreens.notifications}
          title={monitoring_alerts_title()}
        />
      </div>
    </MarketingStorySection>
    <MarketingStorySection
      description={monitoring_filters_description()}
      mutedText={monitoring_filters_title_muted()}
      title={monitoring_filters_title()}
      className={styles.alternateSection}
    >
      <MarketingOptionsPanel
        screen={productScreens.preferences}
        options={[
          monitoring_filters_option_area(),
          monitoring_filters_option_not_relevant(),
          monitoring_filters_option_scanned(),
          monitoring_filters_option_repeats(),
        ]}
      />
    </MarketingStorySection>
    <MarketingStorySection
      description={monitoring_flow_description()}
      mutedText={monitoring_flow_title_muted()}
      title={monitoring_flow_title()}
    >
      <MarketingFlowPanel
        screen={productScreens.posts}
        steps={[
          monitoring_flow_step_scan(),
          monitoring_flow_step_rank(),
          monitoring_flow_step_open(),
        ]}
      />
    </MarketingStorySection>
  </>
);
