import { getTextDirection } from "#/paraglide/runtime";

/**
 * The dir of a box the user types into. dir="auto" follows the first
 * letter, but with no letter yet (an empty box, or only digits and spaces)
 * browsers fall back to left-to-right, which puts the caret on the left of
 * a Hebrew page. Until a letter is typed the box follows the page's
 * direction; then "auto" lets the text flip it.
 *
 * @param value - The box's text.
 * @returns auto, or the page's direction.
 */
export const typedTextDirection = (value: string) =>
  /\p{L}/u.test(value) ? "auto" : getTextDirection();
