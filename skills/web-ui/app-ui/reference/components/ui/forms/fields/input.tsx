import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";
import type { ComponentProps } from "react";

const Input = ({ className, type, ...props }: ComponentProps<"input">) => (
  <InputPrimitive
    type={type}
    data-slot="input"
    className={cn(
      "app-input w-full min-w-0 file:inline-flex file:border-0 file:bg-transparent file:text-foreground disabled:pointer-events-none",
      className
    )}
    {...props}
  />
);

export { Input };
