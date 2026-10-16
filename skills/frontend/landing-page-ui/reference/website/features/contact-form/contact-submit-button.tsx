import { AnimatePresence } from "motion/react";
import { button as MotionButton, span as MotionSpan } from "motion/react-m";
import { TextMorph } from "torph/react";

import {
  contact_sending,
  contact_submit,
  contact_success_title,
} from "#/paraglide/messages";

import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";
import { buttons } from "../../shared/ui/button/button.styles";
import { contactFormStyles as styles } from "./contact-form.styles";

const verifyIconSpring = {
  damping: 80,
  mass: 4,
  restDelta: 0.0001,
  stiffness: 800,
  type: "spring",
} as const;

const ContactSuccessCheck = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.submitIcon}
  >
    <circle cx="8" cy="8" fill="white" fillOpacity="0.2" r="8" />
    <path
      d="M4.78 8.13L6.98 10.64L11.05 5.63"
      stroke="white"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
  </svg>
);

interface ContactSubmitButtonProps {
  pending: boolean;
  prefersReducedMotion: boolean | null;
  success: boolean;
}

const getSubmitLabel = (pending: boolean, success: boolean) => {
  if (success) {
    return contact_success_title();
  }

  if (pending) {
    return contact_sending();
  }

  return contact_submit();
};

/**
 * The contact form's send button: its label turns to sending, then to the
 * success title with a check as its color turns to success; it is disabled
 * meanwhile.
 *
 * @param props - pending: whether the message is sending; prefersReducedMotion:
 *   whether to skip the motion; success: whether it was sent.
 * @returns The button.
 */
export const ContactSubmitButton = ({
  pending,
  prefersReducedMotion,
  success,
}: ContactSubmitButtonProps) => (
  <MotionButton
    animate={{
      backgroundColor: success
        ? "var(--color-success)"
        : "var(--color-button-brand)",
      color: success
        ? "var(--color-brand-white)"
        : "var(--color-button-text-on-brand)",
    }}
    disabled={pending || success}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    type="submit"
    whileHover={
      success
        ? undefined
        : { backgroundColor: "var(--color-button-brand-hover)" }
    }
    whileTap={prefersReducedMotion === true ? undefined : { scale: 0.96 }}
    className={cn(
      typography.marketingCardLabel,
      buttons.base,
      buttons.pill,
      buttons.solidAccent,
      styles.submit
    )}
  >
    <TextMorph as="span" duration={400} ease="cubic-bezier(0.19, 1, 0.22, 1)">
      {getSubmitLabel(pending, success)}
    </TextMorph>
    <MotionSpan
      animate={
        success
          ? { marginInlineStart: 8, width: 18 }
          : { marginInlineStart: 0, width: 0 }
      }
      initial={false}
      transition={{ duration: prefersReducedMotion === true ? 0 : 0.15 }}
      className={styles.submitIconWrap}
    >
      <AnimatePresence initial={false}>
        {success ? (
          <MotionSpan
            animate={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              scale: 0.6,
              transition: verifyIconSpring,
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            key="check"
            transition={
              prefersReducedMotion === true
                ? { duration: 0 }
                : { ...verifyIconSpring, delay: 0.1 }
            }
            className={styles.submitIconSlot}
          >
            <ContactSuccessCheck />
          </MotionSpan>
        ) : null}
      </AnimatePresence>
    </MotionSpan>
  </MotionButton>
);
