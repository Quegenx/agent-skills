import { ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSpring } from "motion/react";
import { span as MotionSpan } from "motion/react-m";
import type { PointerEvent } from "react";
import { useRef, useState } from "react";

import { localizeHref } from "#/paraglide/runtime";

import { supportContentStyles } from "../../../shared/layout/content/support-content.styles";
import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import type { HelpTopic } from "../data/help-center-model";
import { helpTopicCardStyles as styles } from "./help-topic-card.styles";

interface HelpTopicCardProps {
  topic: HelpTopic;
}

const topicSpring = {
  damping: 16,
  mass: 1,
  stiffness: 400,
};

/**
 * A help topic's card, tilting toward the pointer on hover.
 *
 * @param props - topic: the topic.
 * @returns The card's link.
 */
export const HelpTopicCard = ({ topic }: HelpTopicCardProps) => {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const x = useSpring(0, topicSpring);
  const y = useSpring(0, topicSpring);
  const rotate = useSpring(0, topicSpring);
  const scale = useSpring(1, topicSpring);

  const resetIllustration = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
    rotate.set(0);
    scale.set(1);
  };

  const _handleOnPointerEnter = () => {
    setIsHovered(true);
  };

  const _handleOnPointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    const bounds = cardRef.current?.getBoundingClientRect();

    if (!bounds) {
      return;
    }

    const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5;
    x.set(6 * normalizedX);
    y.set(6 * normalizedY);
    rotate.set(6 * normalizedX);
    scale.set(1.1);
  };

  return (
    <a
      href={localizeHref(topic.href)}
      onPointerEnter={_handleOnPointerEnter}
      onPointerLeave={resetIllustration}
      onPointerMove={_handleOnPointerMove}
      ref={cardRef}
      className={styles.card}
    >
      <span className={styles.illustrationContainer}>
        <MotionSpan
          style={{ rotate, scale, x, y }}
          className={styles.illustration}
        >
          <HugeiconsIcon
            color="var(--help-topic-icon-color)"
            icon={topic.icon}
            size={46}
            strokeWidth={1.5}
          />
        </MotionSpan>
      </span>
      <span className={styles.content}>
        <span className={cn(typography.marketingCardLabel, styles.title)}>
          {topic.title}
        </span>
        <span
          className={cn(
            typography.marketingBodyCompact,
            supportContentStyles.description,
            styles.description
          )}
        >
          {topic.description}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cn(styles.arrow, isHovered && styles.arrowActive)}
      >
        <HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={1.5} />
      </span>
    </a>
  );
};
