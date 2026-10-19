import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domAnimation,
} from "motion/react";
import { div as MotionDiv } from "motion/react-m";
import type { ComponentProps } from "react";

import { app_cancel } from "#/paraglide/messages";
import { Button } from "@/components/ui/general/button";
import { appDirection } from "@/lib/i18n/app-direction";

// Its spring out of the confirm button and back into it, without bounce:
// an overshooting width swelled ביטול and shoved its neighbours past where
// they settle, on opening and again on closing.
const confirmCancelSpring = {
  type: "spring",
  bounce: 0,
  duration: 0.35,
} as const;

/**
 * An in-place confirmation's ביטול, as iOS asks instead of a dialog: the
 * action button's text morphs into the confirmation (MorphText) and this
 * springs out of its side while show is true, then back into it. It takes
 * real room as it opens, its width growing from nothing, so what sits beside
 * the button slides aside to make way instead of being covered. Focus lands
 * on it, the safe choice. side is which side of the confirm button it sits
 * on (InPlaceConfirmButton places it there), so it springs out of the
 * button and not away from it.
 *
 * @returns The cancel button, or nothing while the confirmation is not shown.
 */
export const ConfirmCancelButton = ({
  show,
  disabled,
  size,
  side = "end",
  onCancel,
}: {
  show: boolean;
  disabled?: boolean;
  size?: ComponentProps<typeof Button>["size"];
  side?: "start" | "end";
  onCancel: () => void;
}) => {
  // It starts tucked under the confirm button, which is on its other side.
  const towardStart = appDirection() === "rtl" ? 24 : -24;
  const tucked = side === "end" ? towardStart : -towardStart;

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <AnimatePresence initial={false}>
          {/* oxlint-disable react-doctor/no-layout-property-animation --
              Its width is what makes room: growing it is what slides the
              neighbours aside. One small box for under half a second; a
              transform would leave them covered, as before. */}
          {show && (
            <MotionDiv
              key="cancel"
              // Not clipped: a clipped pill shows square cut edges while
              // the width is still small, then turns round.
              className="flex"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={confirmCancelSpring}
            >
              {/* oxlint-enable react-doctor/no-layout-property-animation */}
              {/* The gap to the confirm button is inside the growing width,
                  so it opens with it instead of appearing at once.
                  shrink-0 and nowrap: squeezed into the still-narrow width,
                  ביטול wrapped a letter per line, grew tall and stretched the
                  confirm button with it. */}
              <MotionDiv
                className={`w-max shrink-0 whitespace-nowrap ${side === "end" ? "ps-1.5" : "pe-1.5"}`}
                initial={{ scale: 0.9, x: tucked }}
                animate={{ scale: 1, x: 0 }}
                exit={{ scale: 0.9, x: tucked }}
                transition={confirmCancelSpring}
              >
                <Button
                  variant="outline"
                  size={size}
                  disabled={disabled}
                  autoFocus
                  onClick={onCancel}
                >
                  {app_cancel()}
                </Button>
              </MotionDiv>
            </MotionDiv>
          )}
        </AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  );
};
