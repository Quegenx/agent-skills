/**
 * For callers that keep a NumberInput's number as text ("" for none): the
 * text as its value, and its value back as text.
 *
 * @param text - The field's text.
 * @returns The number, or null for empty or invalid text.
 */
export const numberInputValue = (text: string) => {
  const value = Number(text);

  return text.trim() && Number.isFinite(value) ? value : null;
};

/**
 * A NumberInput's value back as text, "" for none.
 *
 * @param value - The number, or null.
 * @returns The text.
 */
export const numberInputText = (value: number | null) =>
  value === null ? "" : String(value);
