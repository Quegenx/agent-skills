import type { ClassValue } from "cn";
import { clsx } from "cn";
import { createCn } from "cn/config";

// tailwind-merge's class groups, taught the website theme's spacing and
// radius names (website.css) so they group like Tailwind's own scale.
const mergeTailwindClasses = createCn({
  extend: {
    theme: {
      radius: [
        "control",
        "large",
        "medium",
        "pill",
        "small",
        "xlarge",
        "xsmall",
      ],
      spacing: [
        "anchor-scroll-offset",
        "content-max",
        "control-height-large",
        "control-height-medium",
        "control-height-small",
        "header-height",
        "header-height-compact",
        "page-header-block-start",
        "page-header-block-start-compact",
        "page-inline",
        "page-inline-compact",
        "scrollbar-width",
        "section-block",
        "section-block-wide",
      ],
    },
  },
});

const whitespace = /\s+/u;

// The utility without its variants: "max-[48rem]:hover:pt-5" -> "pt-5". A
// colon inside [] or () belongs to an arbitrary value or variant.
const stripClassVariants = (className: string) => {
  let depth = 0;
  let start = 0;

  for (let index = 0; index < className.length; index += 1) {
    const character = className[index];

    if (character === "[" || character === "(") {
      depth += 1;
    } else if (character === "]" || character === ")") {
      depth -= 1;
    } else if (character === ":" && depth === 0) {
      start = index + 1;
    }
  }

  return className.slice(start);
};

const replacesUtility = (earlier: string, later: string) =>
  mergeTailwindClasses(earlier, later) === later;

// Whether two utilities set the same property: each replaces the other.
// tailwind-merge also lets a shorthand drop an earlier longhand (p after px,
// text-[size] after leading); the website's styles keep both and let the
// longhand win, as Tailwind's own rule order does. Cached: the same pairs repeat every render.
const sharedPropertyCache = new Map<string, boolean>();

const setsSameProperty = (earlier: string, later: string) => {
  const key = `${earlier} ${later}`;
  let shared = sharedPropertyCache.get(key);

  if (shared === undefined) {
    shared = replacesUtility(earlier, later) && replacesUtility(later, earlier);
    sharedPropertyCache.set(key, shared);
  }

  return shared;
};

const toClassList = (input: ClassValue) =>
  clsx(input).split(whitespace).filter(Boolean);

const flattenClassInputs = (inputs: ClassValue[]): ClassValue[] =>
  inputs.flatMap((input) =>
    Array.isArray(input) ? flattenClassInputs(input) : [input]
  );

/**
 * Merges the website's class strings: each argument is one style, and a
 * later style that sets a property replaces every earlier value of it, at
 * every breakpoint and state. tailwind-merge alone replaces only the same variant, so an earlier
 * `max-[48rem]:pt-5` would outlive a later `pt-2`.
 *
 * @param inputs - Class strings, conditionals and lists, as clsx takes them.
 * @returns The merged class string.
 */
export const cn = (...inputs: ClassValue[]) => {
  let merged: string[] = [];

  for (const input of flattenClassInputs(inputs)) {
    const classes = toClassList(input);
    const utilities = classes.map(stripClassVariants);

    merged = merged.filter((className) => {
      const utility = stripClassVariants(className);

      return !utilities.some((later) => setsSameProperty(utility, later));
    });
    merged.push(...classes);
  }

  return merged.join(" ");
};
