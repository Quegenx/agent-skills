"use client";

import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { useMemo } from "react";
import type { ReactNode } from "react";

import { Label } from "@/components/ui/forms/fields/label";

const FieldSet = ({
  className,
  ...props
}: React.ComponentProps<"fieldset">) => (
  <fieldset
    data-slot="field-set"
    className={cn(
      "flex flex-col gap-6 has-[>[data-slot=checkbox-group]]:gap-ui-sm has-[>[data-slot=radio-group]]:gap-3",
      className
    )}
    {...props}
  />
);

const FieldLegend = ({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) => (
  <legend
    data-slot="field-legend"
    data-variant={variant}
    className={cn(
      "mb-3 font-medium data-[variant=label]:text-base data-[variant=legend]:text-base",
      className
    )}
    {...props}
  />
);

const fieldGroupLayouts = {
  default: "flex flex-col",
  search: "group-search-grid grid",
  city: "city-search-grid grid",
  filters: "group-results-filter-grid grid",
  // Three columns, two and then one as the container narrows: the Ad
  // Library filters, and each action's pace in אוטומציה וקצב.
  "ad-filters": "group-results-filter-grid ad-filter-grid grid",
  // Short fields in pairs, one column on narrow screens.
  pairs: "field-pairs-grid grid",
};

const FieldGroup = ({
  className,
  layout = "default",
  ...props
}: React.ComponentProps<"div"> & {
  layout?: keyof typeof fieldGroupLayouts;
}) => (
  <div
    data-slot="field-group"
    className={cn(
      "group/field-group @container/field-group w-full gap-ui-md data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4",
      fieldGroupLayouts[layout],
      className
    )}
    {...props}
  />
);

const fieldVariants = cva(
  "group/field flex w-full gap-3 data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        // A checkbox or radio sits 8px from its label: the box is drawn 2px
        // inside its 24px button, so gap-3 read as a gap as wide as the one
        // to the next option and the label looked detached from its box.
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start has-[>[role=checkbox],>[role=radio]]:gap-2 *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
);

const Field = ({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) => (
  <div
    data-slot="field"
    data-orientation={orientation}
    className={cn(fieldVariants({ orientation }), className)}
    {...props}
  />
);

const FieldContent = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="field-content"
    className={cn(
      "group/field-content flex flex-1 flex-col gap-1 leading-snug",
      className
    )}
    {...props}
  />
);

const FieldLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof Label>) => (
  <Label
    data-slot="field-label"
    className={cn(
      "group/field-label peer/field-label flex w-fit gap-2 group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-xl has-[>[data-slot=field]]:border has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-input/40 *:data-[slot=field]:p-4 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",
      "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
      className
    )}
    {...props}
  />
);

const FieldTitle = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="field-label"
    className={cn(
      "flex w-fit items-center gap-2 text-base font-normal group-data-[disabled=true]/field:opacity-50",
      className
    )}
    {...props}
  />
);

const FieldDescription = ({
  className,
  ...props
}: React.ComponentProps<"p">) => (
  <p
    data-slot="field-description"
    className={cn(
      "text-start type-card-meta font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5",
      "last:mt-0 nth-last-2:-mt-1",
      "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
      className
    )}
    {...props}
  />
);

// Whether a field message has something to show.
const hasFieldContent = (node: ReactNode) =>
  node !== undefined && node !== null && node !== "";

const FieldError = ({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: ({ message?: string } | undefined)[];
}) => {
  const content = useMemo((): ReactNode => {
    if (hasFieldContent(children)) {
      return children;
    }

    if (errors?.length === undefined || errors?.length === 0) {
      return null;
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ];

    if (uniqueErrors.length === 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul className="ms-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error) =>
            error?.message !== undefined &&
            error.message !== "" && <li key={error.message}>{error.message}</li>
        )}
      </ul>
    );
  }, [children, errors]);

  if (!hasFieldContent(content)) {
    return null;
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-sm font-normal text-destructive", className)}
      {...props}
    >
      {content}
    </div>
  );
};

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
  FieldContent,
  FieldTitle,
};
