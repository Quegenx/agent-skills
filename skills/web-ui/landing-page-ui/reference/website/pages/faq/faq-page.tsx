import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import {
  faq_page_description,
  faq_page_on_this_page,
  faq_page_title,
} from "#/paraglide/messages";

import { MarketingMotionPage } from "../../shared/layout/page/marketing-motion-page";
import { MarketingPageHeader } from "../../shared/layout/page/marketing-page-header";
import { marketingPageStyles } from "../../shared/layout/page/marketing-page.styles";
import { AnimatedTitleText } from "../../shared/motion/animated-title-text";
import {
  ScrollReveal,
  ScrollRevealSeparator,
} from "../../shared/motion/scroll-reveal";
import { sectionNavigationInViewOptions } from "../../shared/navigation/section-navigation-observer";
import { SideSectionNavigation } from "../../shared/navigation/side-section-navigation";
import { layouts } from "../../shared/styles/layouts";
import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";
import { AccordionItem } from "../../shared/ui/accordion/accordion-item";
import { useAccordionOpenItem } from "../../shared/ui/accordion/accordion-open-item";
import { HelpCta } from "../help/page/help-cta";
import { FaqPageAnimatedText } from "./faq-page-animated-text";
import type { FaqPageSection } from "./faq-page-data";
import { getFaqPageSections } from "./faq-page-data";
import { FaqPageSupport } from "./faq-page-support";
import { faqPageStyles as styles } from "./faq-page.styles";

interface FaqPageCategoryProps {
  onSectionInView: (sectionId: string) => void;
  section: FaqPageSection;
  sectionIndex: number;
}

const FaqPageCategory = ({
  onSectionInView,
  section,
  sectionIndex,
}: FaqPageCategoryProps) => {
  const { openIndex, handleItemToggles } = useAccordionOpenItem(
    section.items.length
  );

  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, sectionNavigationInViewOptions);

  useEffect(() => {
    if (isInView) {
      onSectionInView(section.id);
    }
  }, [isInView, onSectionInView, section.id]);

  return (
    <section aria-labelledby={section.id} ref={sectionRef}>
      <ScrollReveal>
        <h2
          id={section.id}
          className={cn(
            typography.heading3,
            styles.categoryTitle,
            sectionIndex > 0 && styles.categoryTitleSpaced
          )}
        >
          {section.title}
        </h2>
      </ScrollReveal>
      <div>
        {section.items.map((item, index) => (
          <ScrollReveal key={item.id}>
            <AccordionItem
              index={index}
              isOpen={openIndex === index}
              item={item}
              onToggle={handleItemToggles[index]}
              pageMode
              prefersReducedMotion={prefersReducedMotion}
            />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
};

/**
 * The FAQ page: its sections by topic, with a side navigation following the one
 * in view, then help.
 *
 * @returns The page.
 */
export const FaqPage = () => {
  const sections = getFaqPageSections();

  const [activeSectionId, setActiveSectionId] = useState(
    () => sections[0]?.id ?? ""
  );

  return (
    <MarketingMotionPage>
      <ScrollReveal>
        <MarketingPageHeader>
          <div className={marketingPageStyles.headerTitleGroup}>
            <h1
              className={cn(
                typography.marketingDisplayTitle,
                marketingPageStyles.title,
                styles.title
              )}
            >
              <AnimatedTitleText text={faq_page_title()} />
            </h1>
          </div>
          <p
            className={cn(
              typography.marketingContentTitle,
              marketingPageStyles.description,
              styles.description
            )}
          >
            <FaqPageAnimatedText delay={0.5} text={faq_page_description()} />
          </p>
        </MarketingPageHeader>
      </ScrollReveal>
      <section
        data-alternate-styling="false"
        data-full-width="false"
        className={cn(
          layouts.centeredColumn,
          layouts.pageBlockPadding,
          marketingPageStyles.afterHeaderSection
        )}
      >
        <div className={layouts.contentNarrow}>
          <div className={styles.faqGrid}>
            <SideSectionNavigation
              activeItemId={activeSectionId}
              indicatorLayoutId="faq-section-indicator"
              items={sections.map((section) => ({
                id: section.id,
                label: section.title,
              }))}
              label={faq_page_on_this_page()}
            />
            <article>
              {sections.map((section, index) => (
                <FaqPageCategory
                  key={section.id}
                  onSectionInView={setActiveSectionId}
                  section={section}
                  sectionIndex={index}
                />
              ))}
            </article>
          </div>
        </div>
      </section>
      <ScrollRevealSeparator className={styles.divider} />
      <ScrollReveal>
        <FaqPageSupport />
      </ScrollReveal>
      <HelpCta />
    </MarketingMotionPage>
  );
};
