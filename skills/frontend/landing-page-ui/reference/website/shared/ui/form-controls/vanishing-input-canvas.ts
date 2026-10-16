export const vanishingCanvasScale = 0.5;
export const vanishingCanvasLeftOffset = 16;

const minimumCanvasHeight = 800;

interface VanishingTextLineCenterInput {
  lineHeight: number;
  lineIndex: number;
  paddingTop: number;
}

/**
 * The vanish canvas's size for a field, at the canvas's scale.
 *
 * @param clientWidth - The field's width.
 * @param clientHeight - The field's height.
 * @returns The canvas's width and height.
 */
export const calculateVanishingCanvasDimensions = (
  clientWidth: number,
  clientHeight: number
) => ({
  height: Math.max(
    minimumCanvasHeight,
    Math.ceil(clientHeight / vanishingCanvasScale)
  ),
  width: Math.max(
    1,
    Math.ceil((clientWidth - vanishingCanvasLeftOffset) / vanishingCanvasScale)
  ),
});

/**
 * The vertical center of one line of a field's text, at the canvas's scale.
 *
 * @param line - lineIndex: the line, from 0; lineHeight; paddingTop: the
 *   field's top padding.
 * @returns The line's center.
 */
export const calculateVanishingTextLineCenter = ({
  lineIndex,
  lineHeight,
  paddingTop,
}: VanishingTextLineCenterInput) =>
  (paddingTop + lineHeight * (lineIndex + 0.5)) / vanishingCanvasScale;

/**
 * A field's letter spacing at the canvas's scale.
 *
 * @param letterSpacing - The field's computed letter spacing.
 * @returns The spacing, as pixels.
 */
export const getVanishingCanvasLetterSpacing = (letterSpacing: string) => {
  if (letterSpacing === "normal") {
    return "0px";
  }

  return `${Number(letterSpacing.replace("px", "")) / vanishingCanvasScale}px`;
};

/**
 * A field's text wrapped into lines as wide as the field, as the canvas draws
 * it.
 *
 * @param measureWidth - Measures a text's width.
 * @param value - The field's text.
 * @param maxWidth - The widest a line may be.
 * @returns The lines.
 */
export const wrapVanishingInputText = (
  measureWidth: (text: string) => number,
  value: string,
  maxWidth: number
) =>
  value.split("\n").flatMap((paragraph) => {
    if (paragraph.length === 0) {
      return [""];
    }

    const lines: string[] = [];
    let line = "";

    for (const character of paragraph) {
      const candidate = line + character;

      if (measureWidth(candidate) <= maxWidth || line.length === 0) {
        line = candidate;
        continue;
      }

      const breakIndex = Math.max(
        line.lastIndexOf(" "),
        line.lastIndexOf("\t")
      );

      if (breakIndex > 0) {
        lines.push(line.slice(0, breakIndex).trimEnd());
        line = `${line.slice(breakIndex).trimStart()}${character}`;
      } else {
        lines.push(line);
        line = character;
      }
    }

    lines.push(line);

    return lines;
  });
