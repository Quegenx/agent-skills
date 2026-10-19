interface HeadingEmphasisParts {
  emphasized: string;
  lead: string;
}

const whitespacePattern = /\s+/u;

/**
 * Splits dynamic headings into a stable lead and a short tonal phrase.
 *
 * @param text - The heading's text.
 * @returns The heading's lead words and its emphasized last words.
 */
export const splitHeadingEmphasis = (text: string): HeadingEmphasisParts => {
  const words = text.trim().split(whitespacePattern);

  const emphasizedWordCount = Math.min(
    Math.max(1, Math.ceil(words.length * 0.35)),
    Math.max(1, words.length - 1)
  );

  const splitIndex = words.length - emphasizedWordCount;

  return {
    emphasized: words.slice(splitIndex).join(" "),
    lead: words.slice(0, splitIndex).join(" "),
  };
};
