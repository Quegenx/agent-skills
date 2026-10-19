"use client";

import { cn } from "cn";
import type { ComponentProps } from "react";

const Label = ({ className, htmlFor, ...props }: ComponentProps<"label">) => (
  <label
    htmlFor={htmlFor}
    data-slot="label"
    className={cn(
      "flex items-center gap-2 text-base font-normal select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
      className
    )}
    {...props}
  />
);

export { Label };
