import { div as MotionDiv, path as MotionPath } from "motion/react-m";
import type { ReactNode } from "react";
import { isValidElement, useId } from "react";

import { cn } from "../../styles/site-class-merge";
import { typography } from "../../styles/typography";
import { accordionStyles as styles } from "./accordion.styles";

/**
 * One accordion row's content: its question, answer and anchor id.
 */
export interface AccordionItemContent {
  answer: ReactNode;
  id?: string;
  question: string;
}

interface AccordionItemProps {
  color?: "green" | "purple";
  headingLevel?: 2 | 3;
  index: number;
  isOpen: boolean;
  item: AccordionItemContent;
  onToggle: () => void;
  pageMode?: boolean;
  prefersReducedMotion: boolean | null;
}

const answerPanelVariants = {
  closed: { height: "0rem" },
  open: { height: "auto" },
};

const accordionColorStyles = {
  green: { button: styles.buttonGreen, icon: styles.iconGreen },
  purple: { button: null, icon: null },
} as const;

const accordionReducedMotionTransition = { duration: 0 } as const;

const accordionIconMotionTransition = {
  damping: 20,
  mass: 0.5,
  stiffness: 220,
  type: "spring",
} as const;

const accordionPanelMotionTransition = {
  damping: 18,
  mass: 0.2,
  stiffness: 280,
  type: "spring",
} as const;

const accordionAnswerMotionTransition = {
  damping: 18,
  mass: 0.5,
  stiffness: 200,
  type: "spring",
} as const;

const accordionIconTransition = (prefersReducedMotion: boolean | null) =>
  prefersReducedMotion === true
    ? accordionReducedMotionTransition
    : accordionIconMotionTransition;

const accordionPanelTransition = (prefersReducedMotion: boolean | null) =>
  prefersReducedMotion === true
    ? accordionReducedMotionTransition
    : accordionPanelMotionTransition;

const accordionAnswerTransition = (
  isOpen: boolean,
  prefersReducedMotion: boolean | null
) =>
  prefersReducedMotion === true
    ? accordionReducedMotionTransition
    : { ...accordionAnswerMotionTransition, delay: isOpen ? 0.1 : 0 };

interface AccordionToggleIconProps {
  colorStyle: (typeof accordionColorStyles)["green"]["icon"] | null;
  isOpen: boolean;
  prefersReducedMotion: boolean | null;
}

const AccordionToggleIcon = ({
  colorStyle,
  isOpen,
  prefersReducedMotion,
}: AccordionToggleIconProps) => {
  const iconTransition = accordionIconTransition(prefersReducedMotion);

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      height="52"
      viewBox="0 0 52 52"
      width="52"
      className={cn(styles.icon, colorStyle)}
    >
      <MotionPath
        animate={{
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
        }}
        d="M19 25.5H26L33 25.5"
        strokeLinecap="round"
        strokeWidth="2"
        transition={iconTransition}
      />
      <MotionPath
        animate={{
          transform: isOpen
            ? "rotate(80deg) scale(0)"
            : "rotate(0deg) scale(1)",
        }}
        d="M26 18.5L26 25.5L26 32.5"
        strokeLinecap="round"
        strokeWidth="2"
        transition={iconTransition}
      />
    </svg>
  );
};

interface AccordionItemAnswerPanelProps {
  answer: ReactNode;
  isOpen: boolean;
  pageMode: boolean;
  panelId: string;
  prefersReducedMotion: boolean | null;
  triggerId: string;
}

const AccordionItemAnswerPanel = ({
  answer,
  isOpen,
  pageMode,
  panelId,
  prefersReducedMotion,
  triggerId,
}: AccordionItemAnswerPanelProps) => (
  <MotionDiv
    animate={isOpen ? "open" : "closed"}
    aria-labelledby={triggerId}
    id={panelId}
    inert={!isOpen}
    initial="closed"
    itemProp="acceptedAnswer"
    itemScope
    itemType="https://schema.org/Answer"
    transition={accordionPanelTransition(prefersReducedMotion)}
    variants={answerPanelVariants}
    className={styles.answerWrapper}
  >
    <MotionDiv
      animate={{ opacity: isOpen ? 1 : 0 }}
      initial={false}
      transition={accordionAnswerTransition(isOpen, prefersReducedMotion)}
      className={cn(styles.answer, pageMode && styles.pageAnswer)}
    >
      {isValidElement(answer) ? (
        answer
      ) : (
        <p className={typography.body}>{answer}</p>
      )}
    </MotionDiv>
  </MotionDiv>
);

/**
 * Unique FAQ accordion row with plus-to-minus icon and answer panel.
 *
 * @returns The accordion row.
 */
export const AccordionItem = ({
  color = "purple",
  headingLevel = 3,
  index,
  isOpen,
  item,
  onToggle,
  pageMode = false,
  prefersReducedMotion,
}: AccordionItemProps) => {
  const reactId = useId();
  const triggerId = `faq-trigger-${reactId}`;
  const panelId = `faq-panel-${reactId}`;
  const colorStyles = accordionColorStyles[color];
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <div id={item.id} className={cn(styles.item, pageMode && styles.pageItem)}>
      <div
        data-color={color}
        data-is-open={isOpen}
        className={styles.accordion}
      >
        <Heading className={styles.itemHeading}>
          <button
            aria-controls={panelId}
            aria-expanded={isOpen}
            id={triggerId}
            onClick={onToggle}
            type="button"
            className={cn(
              styles.button,
              colorStyles.button,
              index === 0 && styles.firstButton,
              pageMode && styles.pageButton,
              pageMode && index === 0 && styles.pageFirstButton
            )}
          >
            <span className={cn(typography.callout, styles.question)}>
              {item.question}
            </span>
            <AccordionToggleIcon
              colorStyle={colorStyles.icon}
              isOpen={isOpen}
              prefersReducedMotion={prefersReducedMotion}
            />
          </button>
        </Heading>
        <AccordionItemAnswerPanel
          answer={item.answer}
          isOpen={isOpen}
          pageMode={pageMode}
          panelId={panelId}
          prefersReducedMotion={prefersReducedMotion}
          triggerId={triggerId}
        />
      </div>
    </div>
  );
};
