import {
  competitors_details_body,
  competitors_details_title,
  competitors_filters_body,
  competitors_filters_title,
  competitors_look_description,
  competitors_look_option_copy,
  competitors_look_option_formats,
  competitors_look_option_platforms,
  competitors_look_option_runtime,
  competitors_look_title,
  competitors_look_title_muted,
  competitors_problem_description,
  competitors_problem_panel_body,
  competitors_problem_panel_title,
  competitors_problem_title,
  competitors_problem_title_muted,
  competitors_tools_description,
  competitors_tools_title,
  competitors_tools_title_muted,
} from "#/paraglide/messages";

import { productScreens } from "../../shared/site/product-screens";
import {
  MarketingOptionsPanel,
  MarketingStoryCard,
  MarketingStorySection,
  MarketingStoryPanel,
} from "../../widgets/marketing-story/marketing-story";
import { marketingStoryStyles as styles } from "../../widgets/marketing-story/marketing-story.styles";

/**
 * The competitors page's story: the problem, then how the Ad Library follows
 * competitors' ads.
 *
 * @returns The story sections.
 */
export const CompetitorsStory = () => (
  <>
    <MarketingStorySection
      description={competitors_problem_description()}
      mutedText={competitors_problem_title_muted()}
      title={competitors_problem_title()}
    >
      <MarketingStoryPanel
        body={competitors_problem_panel_body()}
        screen={productScreens.adLibrary}
        title={competitors_problem_panel_title()}
      />
    </MarketingStorySection>
    <MarketingStorySection
      description={competitors_tools_description()}
      mutedText={competitors_tools_title_muted()}
      title={competitors_tools_title()}
    >
      <div className={styles.twoColumnGrid}>
        <MarketingStoryCard
          body={competitors_filters_body()}
          screen={productScreens.adLibraryFilters}
          title={competitors_filters_title()}
        />
        <MarketingStoryCard
          body={competitors_details_body()}
          screen={productScreens.adLibrary}
          title={competitors_details_title()}
        />
      </div>
    </MarketingStorySection>
    <MarketingStorySection
      description={competitors_look_description()}
      mutedText={competitors_look_title_muted()}
      title={competitors_look_title()}
      className={styles.alternateSection}
    >
      <MarketingOptionsPanel
        screen={productScreens.adLibraryFilters}
        options={[
          competitors_look_option_runtime(),
          competitors_look_option_formats(),
          competitors_look_option_copy(),
          competitors_look_option_platforms(),
        ]}
      />
    </MarketingStorySection>
  </>
);
