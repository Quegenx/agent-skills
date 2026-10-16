import {
  ai_agent_approval_description,
  ai_agent_approval_step_prepare,
  ai_agent_approval_step_review,
  ai_agent_approval_step_send,
  ai_agent_approval_title,
  ai_agent_approval_title_muted,
  ai_agent_context_description,
  ai_agent_context_option_groups,
  ai_agent_context_option_memory,
  ai_agent_context_option_opportunities,
  ai_agent_context_option_settings,
  ai_agent_context_title,
  ai_agent_context_title_muted,
  ai_agent_does_description,
  ai_agent_does_groups_body,
  ai_agent_does_groups_title,
  ai_agent_does_tasks_body,
  ai_agent_does_tasks_title,
  ai_agent_does_title,
  ai_agent_does_title_muted,
  ai_agent_problem_description,
  ai_agent_problem_panel_body,
  ai_agent_problem_panel_title,
  ai_agent_problem_title,
  ai_agent_problem_title_muted,
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
 * The AI agent page's story: the problem, then how the agent works and asks
 * before it acts.
 *
 * @returns The story sections.
 */
export const AiAgentStory = () => (
  <>
    <MarketingStorySection
      description={ai_agent_problem_description()}
      mutedText={ai_agent_problem_title_muted()}
      title={ai_agent_problem_title()}
    >
      <MarketingStoryPanel
        body={ai_agent_problem_panel_body()}
        screen={productScreens.agentChat}
        title={ai_agent_problem_panel_title()}
      />
    </MarketingStorySection>
    <MarketingStorySection
      description={ai_agent_does_description()}
      mutedText={ai_agent_does_title_muted()}
      title={ai_agent_does_title()}
    >
      <div className={styles.twoColumnGrid}>
        <MarketingStoryCard
          body={ai_agent_does_groups_body()}
          screen={productScreens.groupSearch}
          title={ai_agent_does_groups_title()}
        />
        <MarketingStoryCard
          body={ai_agent_does_tasks_body()}
          screen={productScreens.tasks}
          title={ai_agent_does_tasks_title()}
        />
      </div>
    </MarketingStorySection>
    <MarketingStorySection
      description={ai_agent_context_description()}
      mutedText={ai_agent_context_title_muted()}
      title={ai_agent_context_title()}
      className={styles.alternateSection}
    >
      <MarketingOptionsPanel
        screen={productScreens.memory}
        options={[
          ai_agent_context_option_memory(),
          ai_agent_context_option_groups(),
          ai_agent_context_option_opportunities(),
          ai_agent_context_option_settings(),
        ]}
      />
    </MarketingStorySection>
    <MarketingStorySection
      description={ai_agent_approval_description()}
      mutedText={ai_agent_approval_title_muted()}
      title={ai_agent_approval_title()}
    >
      <MarketingFlowPanel
        screen={productScreens.agentJoinApproval}
        steps={[
          ai_agent_approval_step_prepare(),
          ai_agent_approval_step_review(),
          ai_agent_approval_step_send(),
        ]}
      />
    </MarketingStorySection>
  </>
);
