import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { useRender } from "@base-ui/react/use-render";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonIconClass = "app-button-icon";

const buttonVariants = cva("app-button", {
  variants: {
    variant: {
      default: "app-button-primary",
      "group-join": "facebook-group-join-button",
      outline: "app-button-secondary",
      secondary: "app-button-secondary",
      surface: "app-button-surface",
      ghost: "app-button-ghost",
      sidebar: "app-button-sidebar",
      destructive: "app-button-destructive",
      "destructive-soft": "app-button-destructive-soft",
      link: "app-button-link",
      "table-link": "app-button-table-link",
    },
    size: {
      default: "app-button-medium",
      xs: "app-button-small",
      sm: "app-button-small",
      lg: "app-button-large",
      icon: buttonIconClass,
      "icon-xs": buttonIconClass,
      "icon-sm": buttonIconClass,
      "icon-lg": buttonIconClass,
      link: "app-button-link-size",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

const Button = ({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) => (
  <ButtonPrimitive
    data-slot="button"
    data-variant={variant}
    data-size={size}
    className={cn(
      buttonVariants({ variant, size: variant === "link" ? "link" : size }),
      className
    )}
    {...props}
  />
);

const ButtonLink = ({
  className,
  variant = "default",
  size = "default",
  render,
  ...props
}: useRender.ComponentProps<"a"> & VariantProps<typeof buttonVariants>) => (
  <>
    {useRender({
      defaultTagName: "a",
      render,
      props: {
        ...props,
        "data-slot": "button-link",
        "data-variant": variant,
        "data-size": size,
        className: cn(
          buttonVariants({
            variant,
            size: variant === "link" ? "link" : size,
          }),
          className
        ),
      },
    })}
  </>
);

export { Button, ButtonLink };
