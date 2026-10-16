import type { ClassValue } from "cn";
import { useReducedMotion } from "motion/react";
import { div as MotionDiv, p as MotionP } from "motion/react-m";
import type { ReactNode } from "react";

import { isNonEmptyText } from "../../../../../backend/shared/text/non-empty-text";
import { AnimatedTitleText } from "../../motion/animated-title-text";
import { ScrollReveal } from "../../motion/scroll-reveal";
import { cn } from "../../styles/site-class-merge";
import { typography } from "../../styles/typography";
import { marketingHeroContentStyles as styles } from "./marketing-hero-content.styles";

const heroEase = [0.19, 1, 0.22, 1] as const;

const heroTransition = (delay: number, reducedMotion: boolean | null) =>
  reducedMotion === true
    ? { duration: 0 }
    : { delay, duration: 0.937, ease: heroEase };

interface MarketingHeroContentProps {
  actions?: ReactNode;
  decoration?: ReactNode;
  description: ReactNode;
  eyebrow?: ReactNode;
  media?: ReactNode;
  titleAccent?: string;
  titleLead: string;
  titleClassName?: ClassValue;
}

// A hero line that rises into place after delay seconds.
const HeroRise = ({
  children,
  delay,
  reducedMotion,
  className,
}: {
  children: ReactNode;
  delay: number;
  reducedMotion: boolean | null;
  className: ClassValue;
}) => (
  <ScrollReveal>
    <MotionDiv
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 8 }}
      transition={heroTransition(delay, reducedMotion)}
      className={cn(className)}
    >
      {children}
    </MotionDiv>
  </ScrollReveal>
);

/**
 * A marketing hero's content: the eyebrow, the two-line title, the description,
 * the actions and the media, revealed in turn.
 *
 * @param props - The hero's eyebrow, titleLead, titleAccent, description,
 *   actions, media and decoration, and their styles.
 * @returns The hero's content.
 */
export const MarketingHeroContent = ({
  actions,
  decoration,
  description,
  eyebrow,
  media,
  titleAccent,
  titleLead,
  titleClassName,
}: MarketingHeroContentProps) => {
  const reducedMotion = useReducedMotion();

  return (
    <div className={styles.content}>
      {decoration}
      {eyebrow !== undefined && eyebrow !== null ? (
        <HeroRise
          delay={0.2}
          reducedMotion={reducedMotion}
          className={[typography.marketingCardTitle, styles.eyebrow]}
        >
          {eyebrow}
        </HeroRise>
      ) : null}
      <div className={styles.headingGroup}>
        <ScrollReveal>
          <h1
            className={cn(
              typography.displayLarge,
              styles.title,
              titleClassName
            )}
          >
            <AnimatedTitleText
              lines={[
                {
                  segments: [{ text: titleLead }],
                },
                ...(isNonEmptyText(titleAccent)
                  ? [
                      {
                        breakBefore: true,
                        segments: [{ text: titleAccent }],
                        className: styles.accent,
                      },
                    ]
                  : []),
              ]}
            />
          </h1>
        </ScrollReveal>
        <ScrollReveal>
          <MotionP
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 12 }}
            transition={heroTransition(0.7, reducedMotion)}
            className={cn(typography.marketingCardTitle, styles.description)}
          >
            {description}
          </MotionP>
        </ScrollReveal>
      </div>
      {actions !== undefined && actions !== null ? (
        <HeroRise
          delay={0.9}
          reducedMotion={reducedMotion}
          className={styles.actions}
        >
          {actions}
        </HeroRise>
      ) : null}
      {media !== undefined && media !== null ? (
        <ScrollReveal>{media}</ScrollReveal>
      ) : null}
    </div>
  );
};
