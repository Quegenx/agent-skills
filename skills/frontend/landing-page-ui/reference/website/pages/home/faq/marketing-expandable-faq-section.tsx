import { MarketingContentSection } from "../../../shared/layout/page/marketing-content-section";
import { marketingContentSectionStyles } from "../../../shared/layout/page/marketing-content-section.styles";
import { AnimatedSectionHeadingText } from "../../../shared/motion/animated-section-heading-text";
import { ScrollReveal } from "../../../shared/motion/scroll-reveal";
import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import type { AccordionItemContent } from "../../../shared/ui/accordion/accordion-item";
import { ExpandableFaqList } from "../../../shared/ui/accordion/expandable-faq-list";
import { homeFaqStyles } from "./home-faq.styles";

interface MarketingExpandableFaqSectionProps {
  items: readonly AccordionItemContent[];
  mutedTitle: string;
  showLessLabel: string;
  showMoreLabel: (count: number) => string;
  title: string;
}

/**
 * Product-page FAQ heading plus expandable list inside a content section.
 *
 * @returns The FAQ section.
 */
export const MarketingExpandableFaqSection = ({
  items,
  mutedTitle,
  showLessLabel,
  showMoreLabel,
  title,
}: MarketingExpandableFaqSectionProps) => (
  <MarketingContentSection>
    <div
      className={cn(
        homeFaqStyles.container,
        marketingContentSectionStyles.faqContentGap
      )}
    >
      <ScrollReveal>
        <h2
          className={cn(
            typography.marketingPageHeading,
            homeFaqStyles.heading,
            marketingContentSectionStyles.responsiveHeading
          )}
        >
          <AnimatedSectionHeadingText mutedText={mutedTitle} text={title} />
        </h2>
      </ScrollReveal>
      <ExpandableFaqList
        items={items}
        revealItems
        showLessLabel={showLessLabel}
        showMoreLabel={showMoreLabel}
      />
    </div>
  </MarketingContentSection>
);
