import { ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { constVoid } from "effect/Function";
import type { MotionStyle, MotionValue } from "motion/react";
import { animate as animateValue, useMotionValue } from "motion/react";
import { div as MotionDiv } from "motion/react-m";
import type { UIEvent } from "react";
import { useEffect, useRef, useState } from "react";

import {
  home_personal_learn_more,
  home_personal_next,
  home_personal_previous,
  home_personal_section_description,
  home_personal_section_title,
  home_personal_section_title_muted,
} from "#/paraglide/messages";
import { getTextDirection, localizeHref } from "#/paraglide/runtime";

import { AnimatedSectionHeadingText } from "../../../shared/motion/animated-section-heading-text";
import { ScrollReveal } from "../../../shared/motion/scroll-reveal";
import { cn } from "../../../shared/styles/site-class-merge";
import { surfaces } from "../../../shared/styles/surfaces";
import { typography } from "../../../shared/styles/typography";
import { ButtonLink } from "../../../shared/ui/button/button";
import { homeProductSectionStyles as productStyles } from "../motion/home-product-section.styles";
import { HomePersonalCapabilityCard } from "./home-personal-capability-card";
import { getHomePersonalCapabilities } from "./home-personal-capability-data";
import { homePersonalCarouselStyles } from "./home-personal-carousel.styles";

type CarouselMaskStyle = MotionStyle &
  Record<"--fade-left" | "--fade-right", MotionValue<number>>;

const fadeInTransition = {
  duration: 0.08,
  ease: "easeOut",
} as const;

const fadeOutTransition = {
  duration: 0.7,
  ease: "easeOut",
} as const;

const isPresent = <Value,>(value: Value | null): value is Value =>
  value !== null;

const getCarouselScrollState = (track: HTMLDivElement) => {
  const maximumScroll = track.scrollWidth - track.clientWidth;
  const scrollPosition = Math.abs(track.scrollLeft);

  return {
    next: scrollPosition < maximumScroll - 1,
    previous: scrollPosition > 0,
  };
};

const HomePersonalCarouselChevron = ({
  direction,
}: {
  direction: "next" | "previous";
}) => (
  <HugeiconsIcon
    icon={ArrowRight01Icon}
    size={16}
    strokeWidth={2}
    className={
      direction === "previous"
        ? homePersonalCarouselStyles.chevronPrevious
        : homePersonalCarouselStyles.chevronNext
    }
  />
);

/**
 * The home page's personal capabilities as a sideways carousel, with previous
 * and next buttons and fading edges, and a link to the personal page.
 *
 * @returns The carousel.
 */
export const HomePersonalCarousel = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const fadeLeft = useMotionValue(0);
  const fadeRight = useMotionValue(1);
  const isRtl = getTextDirection() === "rtl";
  useEffect(() => {
    const track = trackRef.current;

    if (!isPresent(track)) {
      return constVoid;
    }

    const handleResize = () => {
      const scrollState = getCarouselScrollState(track);
      setCanScrollPrevious(scrollState.previous);
      setCanScrollNext(scrollState.next);
    };

    // The track's own size: a window resize, or cards that change width.
    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(track);

    return () => {
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    const controls = animateValue(
      fadeLeft,
      Number(canScrollPrevious),
      canScrollPrevious ? fadeInTransition : fadeOutTransition
    );

    return () => {
      controls.stop();
    };
  }, [canScrollPrevious, fadeLeft]);
  useEffect(() => {
    const controls = animateValue(
      fadeRight,
      Number(canScrollNext),
      canScrollNext ? fadeInTransition : fadeOutTransition
    );

    return () => {
      controls.stop();
    };
  }, [canScrollNext, fadeRight]);

  const scrollCards = (direction: -1 | 1) => {
    const track = trackRef.current;

    if (!isPresent(track)) {
      return;
    }

    const card = track.querySelector<HTMLElement>("[data-card]");
    const distance = card ? card.offsetWidth + 24 : track.clientWidth * 0.8;
    const trackIsRtl = getComputedStyle(track).direction === "rtl";
    track.scrollBy({
      behavior: "smooth",
      left: direction * distance * (trackIsRtl ? -1 : 1),
    });
  };

  const maskStyle: CarouselMaskStyle = {
    "--fade-left": fadeLeft,
    "--fade-right": fadeRight,
  };

  const _handleOnClick = () => {
    scrollCards(-1);
  };

  const _handleOnClick2 = () => {
    scrollCards(1);
  };

  const _handleOnScroll = (event: UIEvent<HTMLDivElement>) => {
    const scrollState = getCarouselScrollState(event.currentTarget);
    setCanScrollPrevious(scrollState.previous);
    setCanScrollNext(scrollState.next);
  };

  return (
    <div className={homePersonalCarouselStyles.section}>
      <div
        className={cn(
          productStyles.subsection,
          homePersonalCarouselStyles.subsection
        )}
      >
        <div className={homePersonalCarouselStyles.headingColumn}>
          <div
            className={cn(
              productStyles.sectionHeading,
              homePersonalCarouselStyles.sectionHeading
            )}
          >
            <ScrollReveal>
              <h2
                className={cn(
                  typography.marketingPageHeading,
                  productStyles.sectionTitle,
                  homePersonalCarouselStyles.sectionTitle
                )}
              >
                <AnimatedSectionHeadingText
                  mutedText={home_personal_section_title_muted()}
                  text={home_personal_section_title()}
                />
              </h2>
            </ScrollReveal>
            <ScrollReveal>
              <p
                className={cn(
                  typography.marketingBodyCompact,
                  productStyles.sectionDescription,
                  homePersonalCarouselStyles.sectionDescription
                )}
              >
                {home_personal_section_description()}
              </p>
            </ScrollReveal>
          </div>
        </div>
        <ScrollReveal>
          <ButtonLink
            href={localizeHref("/personal")}
            size="large"
            className={homePersonalCarouselStyles.softButton}
          >
            {home_personal_learn_more()}
          </ButtonLink>
        </ScrollReveal>
      </div>
      <div className={homePersonalCarouselStyles.carousel}>
        <div className={homePersonalCarouselStyles.controls}>
          <button
            aria-label={home_personal_previous()}
            disabled={!canScrollPrevious}
            onClick={_handleOnClick}
            type="button"
            className={cn(
              surfaces.outlineSubtle,
              homePersonalCarouselStyles.arrowButton
            )}
          >
            <HomePersonalCarouselChevron direction="previous" />
          </button>
          <button
            aria-label={home_personal_next()}
            disabled={!canScrollNext}
            onClick={_handleOnClick2}
            type="button"
            className={cn(
              surfaces.outlineSubtle,
              homePersonalCarouselStyles.arrowButton
            )}
          >
            <HomePersonalCarouselChevron direction="next" />
          </button>
        </div>
        <MotionDiv
          data-fade-left={canScrollPrevious}
          onScroll={_handleOnScroll}
          ref={trackRef}
          style={maskStyle}
          className={cn(
            homePersonalCarouselStyles.track,
            isRtl && homePersonalCarouselStyles.trackRtl
          )}
        >
          {getHomePersonalCapabilities().map((capability) => (
            <ScrollReveal
              key={capability.name}
              viewportAmount={0.01}
              className={homePersonalCarouselStyles.cardReveal}
            >
              <HomePersonalCapabilityCard capability={capability} />
            </ScrollReveal>
          ))}
        </MotionDiv>
      </div>
    </div>
  );
};
