import { Search01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { domAnimation, LazyMotion } from "motion/react";
import { useEffect, useState } from "react";

import {
  help_common_questions_title,
  help_common_questions_title_muted,
  help_description,
  help_faq_show_less,
  help_faq_show_more,
  help_guides_title,
  help_guides_title_muted,
  help_search_button,
  help_search_title,
  help_search_title_muted,
  help_title,
} from "#/paraglide/messages";

import { HelpSearch } from "../../../features/help-search/help-search";
import { marketingContentSectionStyles } from "../../../shared/layout/page/marketing-content-section.styles";
import { AnimatedSectionHeadingText } from "../../../shared/motion/animated-section-heading-text";
import { AnimatedTitleText } from "../../../shared/motion/animated-title-text";
import {
  ScrollReveal,
  ScrollRevealSeparator,
} from "../../../shared/motion/scroll-reveal";
import { cn } from "../../../shared/styles/site-class-merge";
import { surfaces } from "../../../shared/styles/surfaces";
import { typography } from "../../../shared/styles/typography";
import { ExpandableFaqList } from "../../../shared/ui/accordion/expandable-faq-list";
import { MarketingFaqSection } from "../../../shared/ui/accordion/marketing-faq-section";
import { homeFaqStyles } from "../../home/faq/home-faq.styles";
import { getHelpTopics } from "../data/help-center-data";
import {
  getCommonHelpQuestions,
  getHelpQuestions,
} from "../data/help-question-lookup";
import { HelpTopicCard } from "../topic/help-topic-card";
import { HelpCta } from "./help-cta";
import { HelpPageAnimatedText } from "./help-page-animated-text";
import { helpPageStyles as styles } from "./help-page.styles";
import { HelpRequest } from "./help-request";

const getHelpFaqShowMoreLabel = (count: number) =>
  help_faq_show_more({ count });

/**
 * The help center: its search (⌘K), the topics, the common questions, and
 * asking for help.
 *
 * @returns The page.
 */
export const HelpPage = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchHovered, setIsSearchHovered] = useState(false);
  const topics = getHelpTopics();
  const questions = getHelpQuestions();
  const commonQuestions = getCommonHelpQuestions();

  const commonFaqItems = commonQuestions.map((question) => ({
    answer:
      question.bullets.length > 0 ? (
        <div className={styles.faqAnswerContent}>
          <p className={typography.body}>{question.answer}</p>
          <ul className={styles.faqAnswerList}>
            {question.bullets.map((bullet) => (
              <li key={bullet} className={typography.body}>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        question.answer
      ),
    id: question.id,
    question: question.title,
  }));

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if (
        event.key.toLocaleLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener("keydown", openSearch);

    return () => {
      document.removeEventListener("keydown", openSearch);
    };
  }, []);

  const _handleOnClick = () => {
    setIsSearchOpen(true);
  };

  const _handleOnPointerEnter = () => {
    setIsSearchHovered(true);
  };

  const _handleOnPointerLeave = () => {
    setIsSearchHovered(false);
  };

  const _handleOnClose = () => {
    setIsSearchOpen(false);
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <div>
          <div className={styles.hero}>
            <div className={styles.heroArea}>
              <ScrollReveal>
                <header className={cn(styles.heroHeader, styles.header)}>
                  <div className={styles.headerContent}>
                    <h1
                      className={cn(
                        typography.marketingDisplayTitle,
                        styles.title
                      )}
                    >
                      <AnimatedTitleText text={help_title()} />
                    </h1>
                    <p
                      className={cn(
                        typography.marketingContentTitle,
                        styles.description
                      )}
                    >
                      <HelpPageAnimatedText
                        delay={0.5}
                        text={help_description()}
                      />
                    </p>
                  </div>
                </header>
              </ScrollReveal>
              <div className={styles.heroContent}>
                <ScrollReveal>
                  <section
                    className={cn(surfaces.outlineSubtle, styles.searchCard)}
                  >
                    <h2
                      className={cn(
                        typography.marketingSectionHeading,
                        styles.searchTitle
                      )}
                    >
                      <AnimatedSectionHeadingText
                        mutedText={help_search_title_muted()}
                        text={help_search_title()}
                      />
                    </h2>
                    <button
                      onClick={_handleOnClick}
                      onPointerEnter={_handleOnPointerEnter}
                      onPointerLeave={_handleOnPointerLeave}
                      type="button"
                      className={cn(
                        typography.marketingCardLabel,
                        styles.searchButton
                      )}
                    >
                      <span className={styles.searchContent}>
                        <HugeiconsIcon
                          icon={Search01Icon}
                          size={18}
                          strokeWidth={1.75}
                        />
                        <span>{help_search_button()}</span>
                      </span>
                      <span
                        className={cn(
                          typography.label,
                          styles.searchTag,
                          isSearchHovered && styles.searchTagHovered
                        )}
                      >
                        ⌘K
                      </span>
                    </button>
                  </section>
                </ScrollReveal>
              </div>
            </div>
          </div>
          <section className={styles.guidesSection}>
            <div className={styles.guidesContent}>
              <ScrollReveal>
                <h2
                  className={cn(
                    typography.marketingPageHeading,
                    styles.sectionHeading
                  )}
                >
                  <AnimatedSectionHeadingText
                    mutedText={help_guides_title_muted()}
                    text={help_guides_title()}
                  />
                </h2>
              </ScrollReveal>
              <div className={styles.guides}>
                {topics.map((topic) => (
                  <ScrollReveal
                    key={topic.slug}
                    style={{
                      height: "100%",
                    }}
                  >
                    <HelpTopicCard topic={topic} />
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
          <MarketingFaqSection
            containerClassName={homeFaqStyles.container}
            heading={help_common_questions_title()}
            headingClassName={homeFaqStyles.heading}
            innerClassName={styles.commonFaqInner}
            mutedHeading={help_common_questions_title_muted()}
            sectionClassName={marketingContentSectionStyles.section}
          >
            <div className={homeFaqStyles.content}>
              <ExpandableFaqList
                initialVisibleCount={commonFaqItems.length}
                items={commonFaqItems}
                revealItems
                showLessLabel={help_faq_show_less()}
                showMoreLabel={getHelpFaqShowMoreLabel}
              />
            </div>
          </MarketingFaqSection>
          <ScrollRevealSeparator className={styles.divider} />
          <HelpRequest />
          <HelpCta />
        </div>
        {isSearchOpen ? (
          <HelpSearch
            onClose={_handleOnClose}
            questions={questions}
            topics={topics}
          />
        ) : null}
      </main>
    </LazyMotion>
  );
};
