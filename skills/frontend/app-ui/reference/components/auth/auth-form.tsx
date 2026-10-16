import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { MorphIcon } from "morphicons/react";
import { useId, useState } from "react";
import type { ComponentProps, SubmitEvent, ReactNode } from "react";

import { app_password_hide, app_password_show } from "#/paraglide/messages";
import { TooltipHint } from "@/components/ui/display/tooltip";
import { MorphText } from "@/components/ui/general/morph-text";

import { isNonEmptyText } from "../../../backend/shared/text/non-empty-text";

type AuthFieldInputProps = Omit<
  ComponentProps<"input">,
  "id" | "placeholder" | "className"
> & { label: string; labelAside?: ReactNode };

/**
 * The marketing site's contact-form field: the label sits above a soft,
 * rounded input. labelAside puts a link at the label row's far end (the
 * login page's "forgot password"). dir="auto" takes the direction from the
 * first letter, so an email or "\@Gagaga55" keeps its leading symbol in place.
 *
 * @returns The field.
 */
export const AuthTextField = ({
  label,
  labelAside,
  children,
  ...props
}: AuthFieldInputProps & { children?: ReactNode }) => {
  const id = useId();

  return (
    <div className="auth-field">
      <div className="auth-field-header">
        <label htmlFor={id} className="auth-field-label">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="auth-field-box">
        <input {...props} id={id} dir="auto" className="auth-field-input" />
        {children}
      </div>
    </div>
  );
};

/**
 * Password field: the show/hide toggle appears once the field has text, and
 * focus stays in the input while toggling. Like amichai-all's
 * CoursePasswordField, one icon morphs between eye and eye-off (morphicons,
 * "snappy" spring), so nothing swaps or jumps; the button squishes on press
 * (styles/auth/auth-form.css).
 *
 * @param props - The field's props, without its type.
 * @returns The password field.
 */
export const AuthPasswordField = (props: Omit<AuthFieldInputProps, "type">) => {
  const [visible, setVisible] = useState(false);
  const [filled, setFilled] = useState(false);

  return (
    <AuthTextField
      {...props}
      type={visible ? "text" : "password"}
      onInput={(event) => {
        setFilled(event.currentTarget.value !== "");
      }}
    >
      {filled && (
        <TooltipHint
          label={visible ? app_password_hide() : app_password_show()}
        >
          <button
            type="button"
            className="auth-field-toggle"
            aria-label={visible ? app_password_hide() : app_password_show()}
            aria-pressed={visible}
            onPointerDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              setVisible((current) => !current);
            }}
          >
            <MorphIcon
              icon={visible ? ViewOffIcon : ViewIcon}
              aria-hidden="true"
              className="auth-field-toggle-icon"
              strokeWidth={1.75}
              spring="snappy"
              reducedMotion="user"
            />
          </button>
        </TooltipHint>
      )}
    </AuthTextField>
  );
};

/**
 * A notice above an auth form's fields, an error or information.
 *
 * @param props - tone: error or info; children: the notice's text.
 * @returns The notice.
 */
export const AuthNotice = ({
  tone,
  children,
}: {
  tone: "error" | "info";
  children: ReactNode;
}) => (
  <p
    className="auth-notice"
    data-tone={tone}
    role={tone === "error" ? "alert" : "status"}
  >
    {children}
  </p>
);

/**
 * Every auth form: the server's error first, then the step's own notices,
 * then the fields, all disabled while the form submits.
 *
 * @returns The form.
 */
export const AuthForm = ({
  pending,
  error,
  notices,
  onSubmit,
  children,
}: {
  pending: boolean;
  error: string | null;
  notices?: ReactNode;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) => (
  <form className="auth-form" method="post" noValidate onSubmit={onSubmit}>
    {isNonEmptyText(error) && <AuthNotice tone="error">{error}</AuthNotice>}
    {notices}
    <fieldset disabled={pending}>{children}</fieldset>
  </form>
);

/**
 * The label morphs (torph) to pendingLabel while the form submits, like the
 * app's other busy buttons ("מוחק…", "מתנתק…").
 *
 * @returns The submit button.
 */
export const AuthSubmitButton = ({
  pending,
  pendingLabel,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  children: string;
}) => (
  <button
    type="submit"
    className="auth-button"
    data-variant="primary"
    disabled={pending}
    aria-busy={pending}
  >
    <MorphText>{pending ? pendingLabel : children}</MorphText>
  </button>
);
