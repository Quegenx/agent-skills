import { AnimatedWordReveal } from "../../shared/motion/animated-word-reveal";
import { faqPageStyles as styles } from "./faq-page.styles";

interface FaqPageAnimatedTextProps {
  delay?: number;
  text: string;
}

/**
 * FAQ page text revealed word by word.
 *
 * @param props - text: the text; delay: when the reveal starts, in seconds.
 * @returns The animated text.
 */
export const FaqPageAnimatedText = ({
  delay = 0.3,
  text,
}: FaqPageAnimatedTextProps) => (
  <AnimatedWordReveal
    delay={delay}
    text={text}
    wordClassName={styles.animatedWord}
    wrap
  />
);
