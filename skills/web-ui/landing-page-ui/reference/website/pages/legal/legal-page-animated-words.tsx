import { AnimatedWordReveal } from "../../shared/motion/animated-word-reveal";
import { legalPageStyles as styles } from "./legal-page.styles";

interface LegalPageAnimatedWordsProps {
  delay?: number;
  text: string;
}

/**
 * Legal page text revealed word by word.
 *
 * @param props - text: the text; delay: when the reveal starts, in seconds.
 * @returns The animated text.
 */
export const LegalPageAnimatedWords = ({
  delay = 0.3,
  text,
}: LegalPageAnimatedWordsProps) => (
  <AnimatedWordReveal
    delay={delay}
    text={text}
    wordClassName={styles.animatedWord}
    wrap
  />
);
