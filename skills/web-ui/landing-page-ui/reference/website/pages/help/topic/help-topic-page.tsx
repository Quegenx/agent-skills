import { ArrowLeft01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import { useState, useSyncExternalStore } from "react";

import { help_title } from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";

import { MarketingMotionPage } from "../../../shared/layout/page/marketing-motion-page";
import { MarketingPageHeader } from "../../../shared/layout/page/marketing-page-header";
import { marketingPageStyles } from "../../../shared/layout/page/marketing-page.styles";
import { ScrollReveal } from "../../../shared/motion/scroll-reveal";
import { layouts } from "../../../shared/styles/layouts";
import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import { AccordionItem } from "../../../shared/ui/accordion/accordion-item";
import type { HelpTopic } from "../data/help-center-model";
import { getHelpTopicPageQuestions } from "../data/help-question-lookup";
import { HelpCta } from "../page/help-cta";
import { helpTopicPageStyles as styles } from "./help-topic-page.styles";

interface HelpTopicPageProps {
  topic: HelpTopic;
}

const getHashQuestionId = () => window.location.hash.slice(1);
const getServerHashQuestionId = () => "";

const subscribeToHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);

  return () => {
    window.removeEventListener("hashchange", onChange);
  };
};

/**
 * A help topic's page: its questions with their answers, one open at a time,
 * then help.
 *
 * @param props - topic: the topic.
 * @returns The page.
 */
export const HelpTopicPage = ({ topic }: HelpTopicPageProps) => {
  const [selectedOpenIndex, setSelectedOpenIndex] = useState<number | null>(
    null
  );

  const prefersReducedMotion = useReducedMotion();
  const questions = getHelpTopicPageQuestions(topic.questions);

  const hashQuestionId = useSyncExternalStore(
    subscribeToHash,
    getHashQuestionId,
    getServerHashQuestionId
  );

  const hashOpenIndex = questions.findIndex(
    (question) => question.id === hashQuestionId
  );

  const openIndex = selectedOpenIndex ?? hashOpenIndex;

  const handleQuestionToggles = questions.map((_, index) => () => {
    setSelectedOpenIndex((current) => {
      const currentOpenIndex = current ?? hashOpenIndex;

      return currentOpenIndex === index ? -1 : index;
    });
  });

  return (
    <MarketingMotionPage>
      <ScrollReveal>
        <MarketingPageHeader>
          <div className={marketingPageStyles.headerTitleGroup}>
            <a
              href={localizeHref("/help")}
              className={cn(typography.label, styles.backLink)}
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={ArrowLeft01Icon}
                size={16}
                strokeWidth={1.75}
              />
              {help_title()}
            </a>
            <h1
              className={cn(
                typography.marketingDisplayTitle,
                marketingPageStyles.title,
                styles.title
              )}
            >
              {topic.title}
            </h1>
          </div>
          <p
            className={cn(
              typography.marketingContentTitle,
              marketingPageStyles.description,
              styles.description
            )}
          >
            {topic.description}
          </p>
        </MarketingPageHeader>
      </ScrollReveal>
      <section
        className={cn(
          layouts.centeredColumn,
          layouts.pageBlockPadding,
          marketingPageStyles.afterHeaderSection
        )}
      >
        <div className={cn(layouts.contentNarrow, styles.questions)}>
          {questions.map((question, index) => (
            <ScrollReveal key={question.id}>
              <AccordionItem
                headingLevel={2}
                index={index}
                isOpen={openIndex === index}
                item={{
                  answer:
                    question.bullets.length > 0 ? (
                      <div className={styles.answerContent}>
                        <p className={typography.body}>{question.answer}</p>
                        <ul className={styles.answerList}>
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
                }}
                onToggle={handleQuestionToggles[index]}
                pageMode
                prefersReducedMotion={prefersReducedMotion}
              />
            </ScrollReveal>
          ))}
        </div>
      </section>
      <HelpCta />
    </MarketingMotionPage>
  );
};
