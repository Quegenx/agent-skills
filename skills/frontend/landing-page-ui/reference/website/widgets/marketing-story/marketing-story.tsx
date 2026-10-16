import type { ClassValue } from "cn";
import type { ReactNode } from "react";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";
import {
  MarketingContentSection,
  MarketingContentSectionHeader,
} from "../../shared/layout/page/marketing-content-section";
import { marketingContentSectionStyles } from "../../shared/layout/page/marketing-content-section.styles";
import { AnimatedSectionHeadingText } from "../../shared/motion/animated-section-heading-text";
import { ScrollReveal } from "../../shared/motion/scroll-reveal";
import { ProductScreenImage } from "../../shared/site/product-screen-image";
import type { ProductScreen } from "../../shared/site/product-screens";
import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";
import { marketingStoryStyles as styles } from "./marketing-story.styles";

interface MarketingStoryHeaderProps {
  description?: string;
  mutedText: string;
  title: string;
}

const MarketingStoryHeader = ({
  description,
  mutedText,
  title,
}: MarketingStoryHeaderProps) => (
  <MarketingContentSectionHeader grouped={Boolean(description)}>
    <ScrollReveal>
      <h2
        className={cn(
          typography.marketingPageHeading,
          marketingContentSectionStyles.heading,
          marketingContentSectionStyles.responsiveHeading
        )}
      >
        <AnimatedSectionHeadingText mutedText={mutedText} text={title} />
      </h2>
    </ScrollReveal>
    {isNonEmptyText(description) ? (
      <ScrollReveal>
        <p
          className={cn(
            typography.marketingContentTitle,
            marketingContentSectionStyles.description
          )}
        >
          {description}
        </p>
      </ScrollReveal>
    ) : null}
  </MarketingContentSectionHeader>
);

interface MarketingStorySectionProps extends MarketingStoryHeaderProps {
  children?: ReactNode;
  className?: ClassValue;
}

/**
 * A section of a page's story: its heading (MarketingStoryHeader) over the
 * panel, cards or list that show it.
 *
 * @returns The section.
 */
export const MarketingStorySection = ({
  children,
  description,
  mutedText,
  className,
  title,
}: MarketingStorySectionProps) => (
  <MarketingContentSection className={className}>
    <MarketingStoryHeader
      description={description}
      mutedText={mutedText}
      title={title}
    />
    {children}
  </MarketingContentSection>
);

interface MarketingStoryPanelProps {
  body: string;
  screen: ProductScreen;
  onGray?: boolean;
  reverse?: boolean;
  title: string;
}

/**
 * A story section's main panel: a screen of the app beside its title and text,
 * revealed on scroll.
 *
 * @param props - title; body; screen: the app's screen; onGray: on a gray
 *   background; reverse: the screen on the other side.
 * @returns The panel.
 */
export const MarketingStoryPanel = ({
  body,
  screen,
  onGray = false,
  reverse = false,
  title,
}: MarketingStoryPanelProps) => (
  <ScrollReveal>
    <article
      className={cn(
        styles.panelSurface,
        styles.panel,
        onGray && styles.panelOnGray,
        reverse && styles.panelReverse
      )}
    >
      <ProductScreenImage
        loading="lazy"
        screen={screen}
        styles={[styles.panelImage, reverse && styles.reversedImage]}
      />
      <div className={cn(styles.panelCopy, reverse && styles.reversedCopy)}>
        <h3
          className={cn(typography.marketingSectionHeading, styles.panelTitle)}
        >
          {title}
        </h3>
        <p className={cn(typography.marketingContentTitle, styles.panelBody)}>
          {body}
        </p>
      </div>
    </article>
  </ScrollReveal>
);

interface MarketingStoryCardProps {
  body: string;
  screen: ProductScreen;
  onGray?: boolean;
  title: string;
}

/**
 * A story section's card: a screen of the app above its title and text,
 * revealed on scroll.
 *
 * @param props - title; body; screen: the app's screen; onGray: on a gray
 *   background.
 * @returns The card.
 */
export const MarketingStoryCard = ({
  body,
  screen,
  onGray = false,
  title,
}: MarketingStoryCardProps) => (
  <ScrollReveal className={styles.cardReveal}>
    <article className={cn(styles.card, onGray && styles.cardOnGray)}>
      <img
        alt=""
        height={800}
        src={screen.src}
        width={1200}
        className={styles.cardImage}
      />
      <div className={styles.cardCopy}>
        <h3 className={cn(typography.marketingCardTitle, styles.cardTitle)}>
          {title}
        </h3>
        <p className={cn(typography.marketingBodyCompact, styles.cardBody)}>
          {body}
        </p>
      </div>
    </article>
  </ScrollReveal>
);

interface MarketingOptionsPanelProps {
  screen: ProductScreen;
  options: string[];
}

/**
 * A story section's options panel: a screen of the app beside a list of
 * options.
 *
 * @param props - screen: the app's screen; options: the options listed.
 * @returns The panel.
 */
export const MarketingOptionsPanel = ({
  screen,
  options,
}: MarketingOptionsPanelProps) => (
  <ScrollReveal>
    <div className={styles.optionsPanel}>
      <ProductScreenImage screen={screen} styles={[styles.optionsImage]} />
      <ul className={styles.optionList}>
        {options.map((option) => (
          <li
            key={option}
            className={cn(typography.marketingCardLabel, styles.option)}
          >
            {option}
          </li>
        ))}
      </ul>
    </div>
  </ScrollReveal>
);

interface MarketingFlowPanelProps {
  screen: ProductScreen;
  steps: string[];
}

/**
 * A story section's flow panel: a screen of the app beside numbered steps.
 *
 * @param props - screen: the app's screen; steps: the steps, in order.
 * @returns The panel.
 */
export const MarketingFlowPanel = ({
  screen,
  steps,
}: MarketingFlowPanelProps) => (
  <ScrollReveal>
    <div className={cn(styles.panelSurface, styles.flowPanel)}>
      <ProductScreenImage screen={screen} styles={[styles.flowImage]} />
      <ol className={styles.stepList}>
        {steps.map((step, index) => (
          <li key={step} className={styles.step}>
            <span
              aria-hidden="true"
              className={cn(typography.marketingCardLabel, styles.stepNumber)}
            >
              {index + 1}
            </span>
            <span
              className={cn(typography.marketingCardTitle, styles.stepText)}
            >
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  </ScrollReveal>
);

interface MarketingReturnPanelProps {
  body: string;
  screen: ProductScreen;
  title: string;
}

/**
 * A story section's closing panel: a screen of the app beside its title and
 * text.
 *
 * @param props - title; body; screen: the app's screen.
 * @returns The panel.
 */
export const MarketingReturnPanel = ({
  body,
  screen,
  title,
}: MarketingReturnPanelProps) => (
  <ScrollReveal>
    <article className={styles.returnPanel}>
      <ProductScreenImage screen={screen} styles={[styles.returnImage]} />
      <div className={styles.returnCopy}>
        <h3
          className={cn(typography.marketingSectionHeading, styles.returnTitle)}
        >
          {title}
        </h3>
        <p className={cn(typography.marketingContentTitle, styles.returnBody)}>
          {body}
        </p>
      </div>
    </article>
  </ScrollReveal>
);
