import { useReducedMotion } from "motion/react";
import { span as MotionSpan } from "motion/react-m";

import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";
import {
  notFoundQuestionMarkBob,
  notFoundQuestionMarkTransition,
} from "./not-found-character-motion";
import { NotFoundHeadDrawing } from "./not-found-head-drawing";
import { notFoundPageStyles as styles } from "./not-found-page.styles";

const questionMarks = [0, 1, 2] as const;
const eyeAnimationDuration = 1.25;

/**
 * The website's 404 character, animated unless the visitor prefers reduced
 * motion.
 *
 * @returns The decorative illustration.
 */
export const NotFoundIllustration = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className={styles.illustrationPanel}>
      <div className={styles.illustration}>
        <svg
          fill="none"
          height="324"
          viewBox="0 0 324 324"
          width="324"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.illustrationSvg}
        >
          <title>Not Found Illustration</title>
          <NotFoundHeadDrawing
            animated={prefersReducedMotion !== true}
            eyeDuration={eyeAnimationDuration}
          />
        </svg>

        {questionMarks.map((index) => (
          <MotionSpan
            animate={
              prefersReducedMotion === true
                ? undefined
                : notFoundQuestionMarkBob
            }
            key={index}
            style={{
              right: `${16 * index}%`,
              top: `${index % 2 ? 6 : 0}%`,
            }}
            transition={notFoundQuestionMarkTransition(index)}
            className={cn(typography.displayLarge, styles.questionMark)}
          >
            ?
          </MotionSpan>
        ))}
      </div>
    </div>
  );
};
