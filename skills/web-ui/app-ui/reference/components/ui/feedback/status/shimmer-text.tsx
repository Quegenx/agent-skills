import type { CSSProperties } from "react";

type ShimmerTextStyle = CSSProperties & { "--shimmer-spread": string };

/**
 * Work in progress said in words, in place of a spinner: the text names what
 * is happening ("מחפש…", "פותח את פייסבוק…") and a dimmer band sweeps across
 * it, 0.9s a pass, so it reads as busy rather than calm (shimmer-text.css).
 * By default it keeps the text's own color, so it works on a primary button
 * too; tone="muted" is the agent chat's gray. Under reduced motion it is the
 * plain text. The band widens with the text: 2px a letter.
 *
 * @returns The shimmering text.
 */
export const ShimmerText = ({
  children,
  tone,
}: {
  children: string;
  tone?: "muted";
}) => {
  const style: ShimmerTextStyle = {
    "--shimmer-spread": `${children.length * 2}px`,
  };

  return (
    <span className="shimmer-text" data-tone={tone} style={style}>
      {children}
    </span>
  );
};
