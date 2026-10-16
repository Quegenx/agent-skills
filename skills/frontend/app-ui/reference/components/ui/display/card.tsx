import { cn } from "cn";
import type { ComponentProps } from "react";

const Card = ({
  className,
  size = "default",
  ...props
}: ComponentProps<"div"> & { size?: "default" | "sm" }) => (
  <div
    data-slot="card"
    data-size={size}
    className={cn(
      "app-card group/card flex min-w-0 flex-col gap-(--card-spacing) overflow-hidden bg-card text-card-foreground [--card-spacing:--spacing(4)] data-[size=sm]:[--card-spacing:--spacing(4)]",
      className
    )}
    {...props}
  />
);

const CardHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="card-header"
    className={cn(
      "group/card-header @container/card-header grid auto-rows-min items-start gap-2 px-(--card-spacing) pt-(--card-spacing) last:pb-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
      className
    )}
    {...props}
  />
);

const CardTitle = ({
  className,
  variant = "default",
  ...props
}: ComponentProps<"div"> & { variant?: "default" | "metric" }) => (
  <div
    data-slot="card-title"
    data-variant={variant}
    className={cn(
      "type-card-title text-heading data-[variant=metric]:type-display data-[variant=metric]:tabular-nums",
      className
    )}
    {...props}
  />
);

const CardDescription = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="card-description"
    className={cn("text-muted-foreground", className)}
    {...props}
  />
);

const CardAction = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="card-action"
    className={cn(
      "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
      className
    )}
    {...props}
  />
);

const CardContent = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="card-content"
    className={cn(
      "min-w-0 px-(--card-spacing) first:pt-(--card-spacing) last:pb-(--card-spacing)",
      className
    )}
    {...props}
  />
);

const CardFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="card-footer"
    className={cn(
      "flex items-center px-(--card-spacing) pb-(--card-spacing) type-card-meta text-muted-foreground [.border-t]:pt-(--card-spacing)",
      className
    )}
    {...props}
  />
);

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
