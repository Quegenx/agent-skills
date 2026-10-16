import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";

const badgeVariants = cva("app-badge group/badge", {
  variants: {
    variant: {
      default: "app-badge-blue",
      secondary: "app-badge-gray",
      status: "group-status-badge",
      destructive: "app-badge-red",
      outline: "app-badge-outline",
      ghost: "app-badge-ghost",
      link: "app-badge-link",
    },
  },
  defaultVariants: { variant: "default" },
});

const Badge = ({
  className,
  variant = "default",
  render,
  children,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) => (
  <>
    {useRender({
      defaultTagName: "span",
      props: mergeProps<"span">(
        {
          className: cn(badgeVariants({ variant }), className),
          children: <span data-slot="badge-label">{children}</span>,
        },
        props
      ),
      render,
      state: { slot: "badge", variant },
    })}
  </>
);

export { Badge };
