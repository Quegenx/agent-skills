import { AnimatePresence, useReducedMotion } from "motion/react";
import { div as MotionDiv, form as MotionForm } from "motion/react-m";
import type { SubmitEvent, KeyboardEvent } from "react";
import { useRef, useState } from "react";

import {
  contact_email_error,
  contact_email_label,
  contact_email_placeholder,
  contact_form_guidance,
  contact_message_error,
  contact_message_label,
  contact_message_placeholder,
  contact_name_error,
  contact_name_label,
  contact_name_placeholder,
  contact_submit_error,
  contact_success_description,
  contact_success_title,
} from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";

import { trackAnalyticsEvent } from "../../shared/site/google-analytics";
import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";
import type { ContactFieldName } from "./contact-field";
import { ContactField } from "./contact-field";
import { contactEmailPattern, sendContactSubmission } from "./contact-form-api";
import { contactFormStyles as styles } from "./contact-form.styles";
import { ContactSubmitButton } from "./contact-submit-button";

type ContactErrors = Partial<Record<ContactFieldName, string>>;

interface ContactFormValues {
  email: string;
  message: string;
  name: string;
}

const contactSuccessHidden = {
  height: 0,
  marginTop: -24,
  opacity: 0,
} as const;

const contactSuccessVisible = {
  height: "auto",
  marginTop: 0,
  opacity: 1,
} as const;

const validateContactForm = (values: ContactFormValues) => {
  const errors: ContactErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = contact_name_error();
  }

  if (!contactEmailPattern.test(values.email.trim())) {
    errors.email = contact_email_error();
  }

  if (values.message.trim().length < 10) {
    errors.message = contact_message_error();
  }

  return errors;
};

const hasSubmitted = (value: boolean): boolean => value;

/**
 * The website's contact form: name, email and message, checked as typed, with
 * the fields vanishing once the message is sent.
 *
 * @returns The form.
 */
export const ContactForm = () => {
  const [errors, setErrors] = useState<ContactErrors>({});
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [vanishing, setVanishing] = useState(false);

  const [values, setValues] = useState<ContactFormValues>({
    email: "",
    message: "",
    name: "",
  });

  const formRef = useRef<HTMLFormElement>(null);
  const vanishedFieldsRef = useRef(new Set<ContactFieldName>());

  const submissionRef = useRef({
    hasSubmitted: false,
    id: crypto.randomUUID(),
  });

  const prefersReducedMotion = useReducedMotion();

  const submitContactForm = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting || vanishing || success) {
      return;
    }

    const nextErrors = validateContactForm(values);
    submissionRef.current.hasSubmitted = true;
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setStatus("");

    try {
      await sendContactSubmission({
        data: {
          email: values.email.trim(),
          id: submissionRef.current.id,
          locale: getLocale() === "en" ? "en" : "he",
          message: values.message.trim(),
          name: values.name.trim(),
        },
      });
      trackAnalyticsEvent("contact_form_submitted", {
        form_name: "contact",
        locale: getLocale(),
      });
      vanishedFieldsRef.current.clear();
      submissionRef.current.id = crypto.randomUUID();
      setVanishing(true);
    } catch {
      trackAnalyticsEvent("contact_form_failed", {
        form_name: "contact",
        locale: getLocale(),
      });
      setStatus(contact_submit_error());
    }

    setSubmitting(false);
  };

  const updateContactField = (name: ContactFieldName, value: string) => {
    const nextValues = {
      ...values,
      [name]: value,
    };

    setValues(nextValues);

    if (success || vanishing) {
      setSuccess(false);
      setVanishing(false);
      setStatus("");
    }

    if (hasSubmitted(submissionRef.current.hasSubmitted)) {
      setErrors(validateContactForm(nextValues));
    }
  };

  const submitFromTextarea = (event: KeyboardEvent<HTMLFormElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const completeContactFieldVanish = (name: ContactFieldName) => {
    if (vanishedFieldsRef.current.has(name)) {
      return;
    }

    vanishedFieldsRef.current.add(name);
    setValues((currentValues) => ({
      ...currentValues,
      [name]: "",
    }));

    if (vanishedFieldsRef.current.size === 3) {
      setVanishing(false);
      setSuccess(true);
      setStatus(contact_success_title());
    }
  };

  const submitted = submitting || vanishing || success;

  const _handleOnValueChange = (value: string) => {
    updateContactField("name", value);
  };

  const _handleOnVanishComplete = () => {
    completeContactFieldVanish("name");
  };

  const _handleOnValueChange2 = (value: string) => {
    updateContactField("email", value);
  };

  const _handleOnVanishComplete2 = () => {
    completeContactFieldVanish("email");
  };

  const _handleOnValueChange3 = (value: string) => {
    updateContactField("message", value);
  };

  const _handleOnVanishComplete3 = () => {
    completeContactFieldVanish("message");
  };

  return (
    <MotionForm
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      initial={{
        opacity: 0,
        scale: 0.95,
        y: 20,
      }}
      noValidate
      onKeyDown={submitFromTextarea}
      onSubmit={(event) => {
        void submitContactForm(event);
      }}
      ref={formRef}
      transition={
        prefersReducedMotion === true
          ? {
              duration: 0,
            }
          : {
              bounce: 0,
              delay: 0.25,
              duration: 0.7,
              type: "spring",
            }
      }
      className={styles.form}
    >
      <p className={cn(typography.body, styles.description)}>
        {contact_form_guidance()}
      </p>
      <ContactField
        error={errors.name}
        label={contact_name_label()}
        muted={submitted}
        name="name"
        onValueChange={_handleOnValueChange}
        onVanishComplete={_handleOnVanishComplete}
        placeholder={contact_name_placeholder()}
        value={values.name}
        vanishing={vanishing}
      />
      <ContactField
        error={errors.email}
        label={contact_email_label()}
        muted={submitted}
        name="email"
        onValueChange={_handleOnValueChange2}
        onVanishComplete={_handleOnVanishComplete2}
        placeholder={contact_email_placeholder()}
        value={values.email}
        vanishing={vanishing}
      />
      <ContactField
        error={errors.message}
        label={contact_message_label()}
        muted={submitted}
        name="message"
        onValueChange={_handleOnValueChange3}
        onVanishComplete={_handleOnVanishComplete3}
        placeholder={contact_message_placeholder()}
        textarea
        value={values.message}
        vanishing={vanishing}
      />
      <div className={styles.submitResultGroup}>
        <ContactSubmitButton
          pending={submitting}
          prefersReducedMotion={prefersReducedMotion}
          success={submitted}
        />
        <AnimatePresence initial={false} mode="wait">
          {success ? (
            <MotionDiv
              animate={contactSuccessVisible}
              exit={contactSuccessHidden}
              initial={contactSuccessHidden}
              key="contact-success"
              transition={{
                duration: prefersReducedMotion === true ? 0 : 0.28,
                ease: [0.19, 1, 0.22, 1],
              }}
              className={styles.successWrap}
            >
              <div className={styles.successCard}>
                <h3
                  className={cn(
                    typography.marketingCardLabel,
                    styles.successTitle
                  )}
                >
                  {contact_success_title()}
                </h3>
                <p
                  className={cn(
                    typography.marketingBodyCompact,
                    styles.successBody
                  )}
                >
                  {contact_success_description()}
                </p>
              </div>
            </MotionDiv>
          ) : null}
        </AnimatePresence>
      </div>
      <output aria-live="polite" className={styles.status}>
        {status}
      </output>
    </MotionForm>
  );
};
