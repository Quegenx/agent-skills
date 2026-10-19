import { AnimatedWordReveal } from "../../../shared/motion/animated-word-reveal";
import { helpPageStyles as styles } from "./help-page.styles";

interface HelpPageAnimatedTextProps {
  delay?: number;
  text: string;
}

/**
 * Help page text revealed word by word.
 *
 * @param props - text: the text; delay: when the reveal starts, in seconds.
 * @returns The animated text.
 */
export const HelpPageAnimatedText = ({
  delay = 0.3,
  text,
}: HelpPageAnimatedTextProps) => (
  <AnimatedWordReveal
    delay={delay}
    text={text}
    wordClassName={styles.animatedWord}
    wrap
  />
);
