import { ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { domAnimation, LazyMotion, useReducedMotion } from "motion/react";

import {
  faq_learn_more,
  faq_title,
  faq_title_muted,
} from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";

import { SupportContentLink } from "../../../shared/layout/content/support-content-link";
import { AnimatedSectionHeadingText } from "../../../shared/motion/animated-section-heading-text";
import { ScrollReveal } from "../../../shared/motion/scroll-reveal";
import { layouts } from "../../../shared/styles/layouts";
import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import { AccordionItem } from "../../../shared/ui/accordion/accordion-item";
import { useAccordionOpenItem } from "../../../shared/ui/accordion/accordion-open-item";
import { getHomeFaqItems } from "./home-faq-items";
import { homeFaqStyles as styles } from "./home-faq.styles";

/**
 * The home page's FAQ, one answer open at a time.
 *
 * @returns The FAQ section.
 */
export const HomeFaq = () => {
  const prefersReducedMotion = useReducedMotion();
  const items = getHomeFaqItems();
  const { openIndex, handleItemToggles } = useAccordionOpenItem(items.length);

  return (
    <LazyMotion features={domAnimation} strict>
      <section
        data-alternate-styling="false"
        data-full-width="false"
        id="faq"
        className={styles.section}
      >
        <div className={layouts.contentNarrow}>
          <div className={styles.container}>
            <ScrollReveal>
              <h2
                className={cn(typography.marketingPageHeading, styles.heading)}
              >
                <AnimatedSectionHeadingText
                  mutedText={faq_title_muted()}
                  text={faq_title()}
                />
              </h2>
            </ScrollReveal>
            <div className={styles.content}>
              <div className={styles.body}>
                {items.map((item, index) => (
                  <ScrollReveal key={item.question}>
                    <AccordionItem
                      index={index}
                      isOpen={openIndex === index}
                      item={item}
                      onToggle={handleItemToggles[index]}
                      prefersReducedMotion={prefersReducedMotion}
                    />
                  </ScrollReveal>
                ))}
              </div>
              <div className={styles.footer}>
                <ScrollReveal>
                  <SupportContentLink
                    circleClassName={styles.iconCircle}
                    href={localizeHref("/faq")}
                    icon={ArrowRight01Icon}
                    iconSize={16}
                    press
                    className={[typography.marketingCardLabel, styles.link]}
                  >
                    {faq_learn_more()}
                  </SupportContentLink>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </div>
      </section>
    </LazyMotion>
  );
};
