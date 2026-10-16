import NumberFlow from "@number-flow/react";
import { Record as EffectRecord } from "effect";

import { getLocale } from "#/paraglide/runtime";

// A translated message whose numbers roll to each new value (NumberFlow),
// such as "{count} פוסטים" while a search counts what it read. The message
// keeps its own wording and word order in each language: every number
// parameter is rendered as a marker, then the text around the markers is
// kept and each marker becomes its number. Markers sit in the Private Use
// Area, so no message text can contain one.
const numberSlot = (name: string) => `\u{E000}${name}\u{E001}`;
const numberSlotPattern = /\u{E000}(?<name>\w+)\u{E001}/u;

/**
 * A localized message whose numbers flow when they change (NumberFlow), the
 * rest of its text as it is.
 *
 * @param props - message: the message function, given each number's
 *   placeholder; values: the numbers, by name.
 * @returns The message.
 */
export const NumberFlowMessage = <Name extends string>({
  message,
  values,
}: {
  message: (inputs: Record<Name, string>) => string;
  values: Record<Name, number>;
}) => {
  const numbers = new Map<string, number>(Object.entries(values));

  // Each value's name holds its marker.
  const inputs = EffectRecord.map(values, (_, name) => numberSlot(name));

  // Split with the pattern's group: odd entries are parameter names.
  const parts = message(inputs).split(numberSlotPattern);

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <NumberFlow
            key={`number-${part}`}
            value={numbers.get(part) ?? 0}
            locales={getLocale()}
          />
        ) : (
          part
        )
      )}
    </>
  );
};
