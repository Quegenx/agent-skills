import { useRef } from "react";
import type { ReactNode } from "react";

import { TooltipHint } from "@/components/ui/display/tooltip";
import { Button } from "@/components/ui/general/button";
import { AppIcon } from "@/components/ui/general/app-icon";

/**
 * Media side by side, scrolled sideways and snapping to each item, with the
 * app's small gray previous and next buttons over its edges, each the same
 * distance in from its side: the Ad Library's carousel
 * ads and a post's photos. variant sizes the items: "ad" the 188px
 * carousel cards, "post" one photo across most of the card with the next
 * peeking in (media-carousel.css).
 *
 * @returns The carousel.
 */
export const MediaCarousel = ({
  items,
  variant,
  previousLabel,
  nextLabel,
}: {
  items: readonly { key: string; node: ReactNode }[];
  variant: "ad" | "post";
  previousLabel: string;
  nextLabel: string;
}) => {
  const track = useRef<HTMLDivElement>(null);

  // One item and its gap per press. In RTL, scrolling "forward" moves toward
  // negative scrollLeft.
  const step = (direction: 1 | -1) => {
    const element = track.current;
    const item = element?.firstElementChild;

    if (!(element && item instanceof HTMLElement)) {
      return;
    }

    // "8px", or "normal" (no gap) as 0.
    const gap =
      Number(getComputedStyle(element).columnGap.replace("px", "")) || 0;

    const rtl = getComputedStyle(element).direction === "rtl";
    element.scrollBy({
      left: (rtl ? -1 : 1) * direction * (item.offsetWidth + gap),
      behavior: "smooth",
    });
  };

  return (
    <div className="media-carousel" data-variant={variant}>
      <div ref={track} className="media-carousel-track">
        {items.map((item) => (
          <div key={item.key} className="media-carousel-item">
            {item.node}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        // One strip across the carousel holds both, so they sit
        // symmetrically; it lets the pointer through to the media between.
        <div className="media-carousel-steps">
          <TooltipHint label={previousLabel}>
            <Button
              type="button"
              variant="surface"
              size="icon-sm"
              aria-label={previousLabel}
              onClick={() => {
                step(-1);
              }}
            >
              <AppIcon
                icon="chevron-right"
                className="ltr:rotate-180"
              />
            </Button>
          </TooltipHint>
          <TooltipHint label={nextLabel}>
            <Button
              type="button"
              variant="surface"
              size="icon-sm"
              aria-label={nextLabel}
              onClick={() => {
                step(1);
              }}
            >
              <AppIcon
                icon="chevron-left"
                className="ltr:rotate-180"
              />
            </Button>
          </TooltipHint>
        </div>
      )}
    </div>
  );
};
