import { AnimatePresence } from "motion/react";
import { p as MotionP } from "motion/react-m";
import type { ChangeEvent } from "react";
import { useRef } from "react";

import { form_clear_email, form_clear_name } from "#/paraglide/messages";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";
import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";
import { ClearInputButton } from "../../shared/ui/form-controls/clear-input-button";
import { clearInputButtonStyles } from "../../shared/ui/form-controls/clear-input-button.styles";
import {
  SmoothCaretInput,
  SmoothCaretTextarea,
} from "../../shared/ui/form-controls/smooth-caret-fields";
import { VanishingInputOverlay } from "../../shared/ui/form-controls/vanishing-input-overlay";
import { contactFormStyles as styles } from "./contact-form.styles";

/**
 * One of the contact form's fields.
 */
export type ContactFieldName = "email" | "message" | "name";

interface ContactFieldProps {
  error?: string;
  label: string;
  muted: boolean;
  name: ContactFieldName;
  onValueChange: (value: string) => void;
  onVanishComplete: () => void;
  placeholder: string;
  textarea?: boolean;
  value: string;
  vanishing: boolean;
}

/**
 * A contact form field with its label, error, and the vanish effect that clears
 * it after sending.
 *
 * @param props - The field's name, label, placeholder, value handlers and
 *   error; textarea for the message.
 * @returns The field.
 */
export const ContactField = ({
  error,
  label,
  muted,
  name,
  onValueChange,
  onVanishComplete,
  placeholder,
  textarea = false,
  value,
  vanishing,
}: ContactFieldProps) => {
  const errorId = `${name}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fieldProps = {
    "aria-describedby": isNonEmptyText(error) ? errorId : undefined,
    "aria-invalid": Boolean(error),
    autoComplete: name === "message" ? undefined : name,
    disabled: muted,
    id: name,
    name,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onValueChange(event.currentTarget.value);
    },
    placeholder,
    required: true,
    value,
  } as const;

  // Both field kinds share the wrapper and the type, muted and vanishing
  // looks; extra is what only one of them adds.
  const fieldStyle = (extra: string) => ({
    className: cn(
      typography.marketingBodyCompact,
      styles.input,
      extra,
      muted && styles.inputMuted,
      vanishing && styles.inputVanishing
    ),
  });

  const _handleOnClear = () => {
    onValueChange("");
    inputRef.current?.focus();
  };

  return (
    <div className={styles.field}>
      <div className={styles.fieldHeader}>
        <label
          htmlFor={name}
          className={cn(typography.marketingBodyCompact, styles.label)}
        >
          {label}
          <span aria-hidden="true" className={styles.required} />
        </label>
      </div>
      {textarea ? (
        <SmoothCaretTextarea
          minLength={10}
          textareaRef={textareaRef}
          trailingControl={
            <VanishingInputOverlay
              active={vanishing}
              inputRef={textareaRef}
              onComplete={onVanishComplete}
              value={value}
            />
          }
          wrapperClassName={styles.inputWrap}
          {...fieldProps}
          {...fieldStyle(styles.textarea)}
        />
      ) : (
        <SmoothCaretInput
          inputRef={inputRef}
          minLength={name === "name" ? 2 : undefined}
          spellCheck={name !== "email"}
          trailingControl={
            <>
              <VanishingInputOverlay
                active={vanishing}
                inputRef={inputRef}
                onComplete={onVanishComplete}
                value={value}
              />
              <ClearInputButton
                label={
                  name === "email" ? form_clear_email() : form_clear_name()
                }
                onClear={_handleOnClear}
                visible={value.length > 0 && !muted}
              />
            </>
          }
          type={name === "email" ? "email" : "text"}
          wrapperClassName={styles.inputWrap}
          {...fieldProps}
          {...fieldStyle(clearInputButtonStyles.fieldWithButton)}
        />
      )}
      <AnimatePresence initial={false} mode="popLayout">
        {isNonEmptyText(error) ? (
          <MotionP
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 4,
            }}
            id={errorId}
            initial={{
              opacity: 0,
              y: 4,
            }}
            key={error}
            role="alert"
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className={cn(typography.caption, styles.error)}
          >
            {error}
          </MotionP>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
