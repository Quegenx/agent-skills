import { NumberField } from "@base-ui/react/number-field";
import { useState } from "react";

import { app_number_decrease, app_number_increase } from "#/paraglide/messages";
import { AppIcon } from "@/components/ui/general/app-icon";
import { MorphText } from "@/components/ui/general/morph-text";

// As Base UI's NumberField formats the input's own text by default (the
// browser's locale), so the rolling number reads the same.
const numberInputFormat = new Intl.NumberFormat();

/**
 * A whole-number field in our field style, instead of the browser's native
 * spin arrows: − and + beside the number (Base UI's NumberField: hold a
 * button to repeat, arrow keys step, the value stays within min and max).
 * value is null while the field is empty, as for "no minimum". size "sm"
 * fits it among small text, as in a settings accordion.
 *
 * @returns The number field.
 */
export const NumberInput = ({
  id,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  placeholder,
  required,
  disabled,
  invalid,
  size = "default",
}: {
  id: string;
  value: number | null;
  onValueChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  size?: "default" | "sm";
}) => {
  // Typing digits shows the input's own text; the − and + buttons and the
  // arrow keys keep the rolling number. (The buttons focus the input as
  // they step, so focus alone cannot tell the two apart.)
  const [typing, setTyping] = useState(false);

  return (
    <NumberField.Root
      id={id}
      value={value}
      onValueChange={(next) => {
        onValueChange(next);
      }}
      min={min}
      max={max}
      step={step}
      required={required}
      disabled={disabled}
      className="number-input"
      data-size={size}
      data-typing={typing || undefined}
    >
      <NumberField.Group className="number-input-group">
        <NumberField.Decrement
          className="number-input-step"
          onPointerDown={() => {
            setTyping(false);
          }}
          aria-label={app_number_decrease()}
        >
          <AppIcon icon="minus" />
        </NumberField.Decrement>
        {/* The number rolls to each new value (MorphText) over the input,
          whose own text shows only while the user types in it. */}
        <span className="number-input-display">
          <NumberField.Input
            className="number-input-value"
            onBeforeInput={() => {
              setTyping(true);
            }}
            onBlur={() => {
              setTyping(false);
            }}
            placeholder={placeholder}
            aria-invalid={invalid === true || undefined}
          />
          <span aria-hidden="true" className="number-input-morph">
            <MorphText>
              {value === null ? "" : numberInputFormat.format(value)}
            </MorphText>
          </span>
        </span>
        <NumberField.Increment
          className="number-input-step"
          onPointerDown={() => {
            setTyping(false);
          }}
          aria-label={app_number_increase()}
        >
          <AppIcon icon="agent-plus" />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  );
};
