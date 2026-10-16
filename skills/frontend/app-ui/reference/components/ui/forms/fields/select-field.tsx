import { Field, FieldLabel } from "@/components/ui/forms/fields/field";
import { SmoothSelect } from "@/components/ui/navigation/dropdown/smooth-select";

/**
 * A labelled dropdown of fixed choices, such as a task's scan frequency.
 *
 * @returns The labelled dropdown.
 */
export const SelectField = <V extends string>({
  id,
  label,
  items,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  items: readonly { value: V; label: string }[];
  value: V;
  disabled?: boolean;
  onChange: (value: V) => void;
}) => (
  <Field>
    <FieldLabel htmlFor={id}>{label}</FieldLabel>
    <SmoothSelect
      triggerId={id}
      label={label}
      fullWidth
      disabled={disabled}
      items={items}
      value={value}
      onChange={onChange}
    />
  </Field>
);
