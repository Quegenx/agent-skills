import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";

import { AppIcon } from "@/components/ui/general/app-icon";
import type { AppIconName } from "@/components/ui/general/app-icon";

const Empty = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="empty"
    className={cn(
      "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-lg border-dashed p-ui-lg text-center text-balance",
      className
    )}
    {...props}
  />
);

const EmptyHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="empty-header"
    className={cn("flex max-w-sm flex-col items-center gap-2", className)}
    {...props}
  />
);

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        // Gray on a page; white inside a card, which is that gray itself.
        icon: "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground in-data-[slot=card]:bg-background [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const EmptyMedia = ({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) => (
  <div
    data-slot="empty-icon"
    data-variant={variant}
    className={cn(emptyMediaVariants({ variant, className }))}
    {...props}
  />
);

const EmptyTitle = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="empty-title"
    className={cn("type-headline-md text-heading", className)}
    {...props}
  />
);

const EmptyDescription = ({
  className,
  ...props
}: React.ComponentProps<"p">) => (
  <div
    data-slot="empty-description"
    className={cn("text-sm/relaxed text-muted-foreground", className)}
    {...props}
  />
);

const EmptyContent = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="empty-content"
    className={cn(
      "flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance",
      className
    )}
    {...props}
  />
);

// The usual empty state: an icon in its tile, a title and a line on what
// to do (if any), with any actions (children) beneath.
const EmptyState = ({
  children,
  description,
  icon,
  title,
}: {
  children?: React.ReactNode;
  description?: React.ReactNode;
  icon: AppIconName;
  title: React.ReactNode;
}) => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <AppIcon icon={icon} />
      </EmptyMedia>
      <EmptyTitle>{title}</EmptyTitle>
      {description !== undefined && description !== null ? (
        <EmptyDescription>{description}</EmptyDescription>
      ) : null}
    </EmptyHeader>
    {children}
  </Empty>
);

export { EmptyState, EmptyTitle, EmptyContent };
