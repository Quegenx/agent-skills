import {
  AiChat02Icon,
  Briefcase01Icon,
  CustomerSupportIcon,
  HelpCircleIcon,
  Mail01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { ArrowLeft02Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  not_found_back_home,
  not_found_business_description,
  not_found_business_title,
  not_found_description,
  not_found_agent_description,
  not_found_agent_title,
  not_found_faq_description,
  not_found_faq_title,
  not_found_help_description,
  not_found_help_title,
  not_found_contact_description,
  not_found_contact_title,
  not_found_suggestions,
  not_found_suggestions_muted,
  not_found_title,
  not_found_title_accent,
  not_found_title_lead,
} from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";

import { MarketingHeroContent } from "../../shared/layout/hero/marketing-hero-content";
import { MarketingProductHeroMedia } from "../../shared/layout/hero/marketing-product-hero-media";
import { marketingProductHeroStyles as heroStyles } from "../../shared/layout/hero/marketing-product-hero.styles";
import {
  MarketingContentSection,
  MarketingContentSectionHeader,
} from "../../shared/layout/page/marketing-content-section";
import { marketingContentSectionStyles } from "../../shared/layout/page/marketing-content-section.styles";
import { MarketingMotionPage } from "../../shared/layout/page/marketing-motion-page";
import { MarketingSection } from "../../shared/layout/page/marketing-section";
import { AnimatedSectionHeadingText } from "../../shared/motion/animated-section-heading-text";
import { ScrollReveal } from "../../shared/motion/scroll-reveal";
import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";
import { ButtonLink } from "../../shared/ui/button/button";
import {
  HoverArrowTrack,
  useHoverArrowMotion,
} from "../../shared/ui/hover-arrow/hover-arrow-track";
import { marketingStoryStyles } from "../../widgets/marketing-story/marketing-story.styles";
import { notFoundCardStyles as cardStyles } from "./not-found-card.styles";
import { NotFoundIllustration } from "./not-found-illustration";
import { notFoundPageStyles as styles } from "./not-found-page.styles";

const suggestions = [
  {
    description: not_found_contact_description,
    href: "/contact",
    icon: Mail01Icon,
    size: "large",
    title: not_found_contact_title,
  },
  {
    description: not_found_business_description,
    href: "/business",
    icon: Briefcase01Icon,
    size: "large",
    title: not_found_business_title,
  },
  {
    description: not_found_faq_description,
    href: "/faq",
    icon: HelpCircleIcon,
    size: "small",
    title: not_found_faq_title,
  },
  {
    description: not_found_agent_description,
    href: "/ai-agent",
    icon: AiChat02Icon,
    size: "small",
    title: not_found_agent_title,
  },
  {
    description: not_found_help_description,
    href: "/help",
    icon: CustomerSupportIcon,
    size: "small",
    title: not_found_help_title,
  },
] as const;

const SuggestionCard = ({
  description,
  href,
  icon,
  size,
  title,
}: (typeof suggestions)[number]) => {
  const arrowMotion = useHoverArrowMotion();
  const isExternal = href.startsWith("http");
  const resolvedHref = href.startsWith("/") ? localizeHref(href) : href;

  return (
    <a
      href={resolvedHref}
      onBlur={arrowMotion.handleBlur}
      onFocus={arrowMotion.handleFocus}
      onMouseEnter={arrowMotion.handleMouseEnter}
      onMouseLeave={arrowMotion.handleMouseLeave}
      rel={isExternal ? "noopener noreferrer" : undefined}
      target={isExternal ? "_blank" : undefined}
      className={cn(
        cardStyles.card,
        size === "large" ? cardStyles.large : cardStyles.small
      )}
    >
      <div
        className={cn(typography.marketingContentTitle, cardStyles.cardTitle)}
      >
        <div className={cardStyles.cardHeading}>
          <span className={cardStyles.cardIcon}>
            <HugeiconsIcon
              aria-hidden="true"
              icon={icon}
              size={24}
              strokeWidth={1.75}
            />
          </span>
          <p>{title()}</p>
        </div>
        <HoverArrowTrack
          arrowIsMoving={arrowMotion.arrowIsMoving}
          buttonClassName={cardStyles.cardArrow}
          isActive={arrowMotion.isActive}
          onAnimationComplete={arrowMotion.handleAnimationComplete}
          prefersReducedMotion={arrowMotion.prefersReducedMotion}
        />
      </div>
      <p
        className={cn(
          typography.marketingBodyCompact,
          cardStyles.cardDescription
        )}
      >
        {description()}
      </p>
    </a>
  );
};

/**
 * The website's 404 page: what happened, the way back home, and the
 * illustration.
 *
 * @returns The page.
 */
export const NotFoundPage = () => (
  <MarketingMotionPage className={styles.main}>
    <MarketingSection
      innerClassName={heroStyles.inner}
      sectionClassName={heroStyles.section}
    >
      <MarketingHeroContent
        actions={
          <ButtonLink
            href={localizeHref("/")}
            size="large"
            className={heroStyles.ctaWidth}
            tone="solidInk"
          >
            <HugeiconsIcon
              aria-hidden="true"
              icon={ArrowLeft02Icon}
              size={20}
              strokeWidth={1.75}
              className={styles.backIcon}
            />
            {not_found_back_home()}
          </ButtonLink>
        }
        description={not_found_description()}
        eyebrow={<span>{not_found_title()}</span>}
        media={
          <MarketingProductHeroMedia>
            <div className={styles.heroIllustration}>
              <NotFoundIllustration />
            </div>
          </MarketingProductHeroMedia>
        }
        titleAccent={not_found_title_accent()}
        titleLead={not_found_title_lead()}
        titleClassName={heroStyles.title}
      />
    </MarketingSection>

    <MarketingContentSection className={marketingStoryStyles.alternateSection}>
      <MarketingContentSectionHeader>
        <ScrollReveal>
          <h2
            className={cn(
              typography.marketingSectionHeading,
              marketingContentSectionStyles.heading,
              marketingContentSectionStyles.responsiveHeading
            )}
          >
            <AnimatedSectionHeadingText
              mutedText={not_found_suggestions_muted()}
              text={not_found_suggestions()}
            />
          </h2>
        </ScrollReveal>
      </MarketingContentSectionHeader>
      <ScrollReveal>
        <div className={cardStyles.cards}>
          {suggestions.map((suggestion) => (
            <SuggestionCard key={suggestion.title()} {...suggestion} />
          ))}
        </div>
      </ScrollReveal>
    </MarketingContentSection>
  </MarketingMotionPage>
);
