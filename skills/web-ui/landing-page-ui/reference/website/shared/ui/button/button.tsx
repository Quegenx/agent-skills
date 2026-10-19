import type { ClassValue } from "cn";
import type { ComponentProps } from "react";

import { buttonPress } from "../../styles/button-press";
import { cn } from "../../styles/site-class-merge";
import { typography } from "../../styles/typography";
import { buttons } from "./button.styles";

type ButtonSize = "large" | "pill" | "small";

type ButtonTone = "softAccent" | "solidAccent" | "solidInk" | "solidWhite";

interface ButtonStyleProps {
  press?: boolean;
  size: ButtonSize;
  className?: ClassValue;
  tone?: ButtonTone;
}

type ButtonProps = ButtonStyleProps &
  Omit<ComponentProps<"button">, "className" | "style" | "type">;

type ButtonLinkProps = ButtonStyleProps &
  Omit<ComponentProps<"a">, "className" | "style"> & {
    href: string;
  };

const buttonClassName = (
  size: ButtonSize,
  tone: ButtonTone | undefined,
  className: ClassValue
) => ({
  className: cn(
    size === "small" ? typography.label : typography.marketingButton,
    buttons.base,
    buttons[size],
    className,
    tone ? buttons[tone] : false
  ),
});

const ButtonElement = ({
  children,
  press = true,
  size,
  className,
  tone,
  type,
  ...props
}: ButtonProps & { type: "button" | "submit" }) => (
  <button
    {...(press ? buttonPress : undefined)}
    {...buttonClassName(size, tone, className)}
    {...props}
    type={type === "submit" ? "submit" : "button"}
  >
    {children}
  </button>
);

/**
 * Unique marketing button using the shared size and tone recipes.
 *
 * @param props - The button's props; its type is always button.
 * @returns The button.
 */
export const Button = (props: ButtonProps) => (
  <ButtonElement {...props} type="button" />
);

/**
 * Unique marketing button rendered as a link.
 *
 * @returns The link, styled as a button.
 */
export const ButtonLink = ({
  children,
  press = true,
  size,
  className,
  tone,
  ...props
}: ButtonLinkProps) => (
  <a
    {...(press ? buttonPress : undefined)}
    {...buttonClassName(size, tone, className)}
    {...props}
  >
    {children}
  </a>
);
