import { Dialog } from "@base-ui/react/dialog";
import { constVoid } from "effect/Function";
import { m } from "motion/react";
import { useEffect, useRef } from "react";

import {
  app_close,
  app_next_image,
  app_previous_image,
} from "#/paraglide/messages";
import { TooltipHint } from "@/components/ui/display/tooltip";
import { AppIcon } from "@/components/ui/general/app-icon";
import type { AgentChatFile } from "@/lib/agent-chat/conversation/agent-chat-messages";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

// The viewer's zoom out of a thumbnail and back into it: the dialog morph's
// timing (dialog-morph.ts), so every grow from a button feels the same.
const agentChatZoomDuration = 450;
const agentChatZoomEasing = "cubic-bezier(0.33, 1, 0.68, 1)";

// Where a thumbnail sits relative to the image as the viewer shows it: the
// translate and scale that put the image over the thumbnail. The viewer's
// image is object-fit: contain, so the picture is the contained rectangle
// inside the element's box, not the box itself.
const agentChatZoomFromThumbnail = (
  image: HTMLImageElement,
  thumbnail: HTMLElement
) => {
  const box = image.getBoundingClientRect();

  const fit = Math.min(
    box.width / image.naturalWidth,
    box.height / image.naturalHeight
  );

  const width = image.naturalWidth * fit;
  const height = image.naturalHeight * fit;
  const to = thumbnail.getBoundingClientRect();
  // The thumbnail crops (cover), so the image covers it too.
  const scale = Math.max(to.width / width, to.height / height);
  const x = to.left + to.width / 2 - (box.left + box.width / 2);
  const y = to.top + to.height / 2 - (box.top + box.height / 2);

  return `translate(${x}px, ${y}px) scale(${scale})`;
};

const agentChatZoomAllowed = () =>
  !matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The image viewer: the image large on a blurred backdrop, with
 * previous and next buttons beside it when there are several (the arrow keys
 * move too, and both wrap around), and a close button in the corner. The
 * image opened zooms out of its thumbnail and, still showing, back into it
 * on closing; another image grows in from 90% as it shows.
 *
 * @returns The viewer dialog.
 */
export const AgentChatImageViewer = ({
  images,
  index,
  onIndexChange,
  open,
  onOpenChange,
  thumbnail,
}: {
  images: AgentChatFile[];
  index: number;
  onIndexChange: (index: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The tile the viewer was opened from, and which image it shows.
  thumbnail: { element: HTMLElement; index: number } | null;
}) => {
  const image = images.at(index);
  const popupRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  // The first image this opening showed: it alone zooms in, once (the ref
  // is called again on every render). Cleared on closing.
  const openedImageRef = useRef<HTMLImageElement>(null);

  // The opened image, while it can still zoom from or to its thumbnail.
  const zooms =
    thumbnail !== null &&
    thumbnail.index === index &&
    thumbnail.element.isConnected;

  const zoomIn = (element: HTMLImageElement | null) => {
    imageRef.current = element;

    if (!element || openedImageRef.current) {
      return;
    }

    openedImageRef.current = element;

    if (!(zooms && agentChatZoomAllowed())) {
      return;
    }

    // Measured once the picture is decoded, so its natural size is known.
    const zoomWhenDecoded = async () => {
      try {
        await element.decode();
      } catch {
        // A picture that cannot decode still zooms from its thumbnail.
      }

      if (!element.isConnected) {
        return;
      }

      element.animate(
        [
          {
            transform: agentChatZoomFromThumbnail(element, thumbnail.element),
          },
          { transform: "none" },
        ],
        { duration: agentChatZoomDuration, easing: agentChatZoomEasing }
      );
    };

    void zoomWhenDecoded();
  };

  const changeOpen = (next: boolean) => {
    const popup = popupRef.current;
    const element = imageRef.current;

    if (!next) {
      openedImageRef.current = null;
    }

    const zoomsBack = !next && zooms && popup !== null;

    if (zoomsBack && element && agentChatZoomAllowed()) {
      // Back into the thumbnail, fading only at the end. The popup holds
      // still as long, so Base UI waits for it before it unmounts.
      element.animate(
        [
          { transform: "none", opacity: 1 },
          { opacity: 1, offset: 0.7 },
          {
            transform: agentChatZoomFromThumbnail(element, thumbnail.element),
            opacity: 0,
          },
        ],
        {
          duration: agentChatZoomDuration,
          easing: agentChatZoomEasing,
          fill: "forwards",
        }
      );
      popup.animate([{ opacity: 1 }, { opacity: 1 }], {
        duration: agentChatZoomDuration,
      });
    }

    onOpenChange(next);
  };

  const several = images.length > 1;

  const showPrevious = () => {
    onIndexChange((index - 1 + images.length) % images.length);
  };

  const showNext = () => {
    onIndexChange((index + 1) % images.length);
  };

  // Right-to-left: the previous image is to the right.
  useEffect(() => {
    if (!open || !several) {
      return constVoid;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        onIndexChange((index - 1 + images.length) % images.length);
      } else if (event.key === "ArrowLeft") {
        onIndexChange((index + 1) % images.length);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, several, index, images.length, onIndexChange]);

  if (image?.previewUrl === undefined || !isNonEmptyText(image.previewUrl)) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="app-backdrop" />
        <Dialog.Popup
          ref={popupRef}
          className="agent-chat-viewer"
          data-zoom={zooms || undefined}
        >
          <Dialog.Title className="sr-only">{image.name}</Dialog.Title>
          <div className="agent-chat-viewer-stage">
            {several && (
              <TooltipHint label={app_previous_image()}>
                <button
                  type="button"
                  className="agent-chat-viewer-nav"
                  aria-label={app_previous_image()}
                  onClick={showPrevious}
                >
                  <span className="agent-chat-viewer-nav-circle">
                    <AppIcon
                      icon="agent-chevron-right"
                      className="ltr:rotate-180"
                    />
                  </span>
                </button>
              </TooltipHint>
            )}
            <div className="agent-chat-viewer-image">
              <m.img
                key={image.previewUrl}
                ref={zoomIn}
                src={image.previewUrl}
                alt={image.name}
                fetchPriority="high"
                // The opened image zooms out of its thumbnail instead.
                initial={zooms ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {several && (
              <TooltipHint label={app_next_image()}>
                <button
                  type="button"
                  className="agent-chat-viewer-nav"
                  aria-label={app_next_image()}
                  onClick={showNext}
                >
                  <span className="agent-chat-viewer-nav-circle">
                    <AppIcon
                      icon="agent-chevron-left"
                      className="ltr:rotate-180"
                    />
                  </span>
                </button>
              </TooltipHint>
            )}
          </div>
          <TooltipHint label={app_close()} side="bottom">
            <Dialog.Close
              className="agent-chat-viewer-close"
              aria-label={app_close()}
            >
              <AppIcon icon="agent-close" />
            </Dialog.Close>
          </TooltipHint>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// The files above a user's message, as a grid of tiles. Images are
// buttons that fade in one after another and open the viewer; other files
// show an icon, their shortened name and their type.
