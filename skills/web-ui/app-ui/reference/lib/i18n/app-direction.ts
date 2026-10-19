import { getTextDirection } from "#/paraglide/runtime";

/**
 * The app's reading direction for its language: Hebrew right to left,
 * English left to right. Side sheets open from the reading start, where the
 * sidebar is (the right in Hebrew, the left in English).
 *
 * @returns rtl or ltr.
 */
export const appDirection = () => getTextDirection();

/**
 * The side a side sheet opens from: the reading start, right in Hebrew and left
 * in English.
 *
 * @returns right or left.
 */
export const appSheetSide = () =>
  appDirection() === "rtl" ? ("right" as const) : ("left" as const);
