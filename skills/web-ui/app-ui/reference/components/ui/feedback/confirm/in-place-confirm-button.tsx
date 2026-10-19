import type { ComponentProps, ReactNode } from "react";

import { ConfirmCancelButton } from "@/components/ui/feedback/confirm/confirm-cancel-button";
import { Button } from "@/components/ui/general/button";
import { MorphText } from "@/components/ui/general/morph-text";

import { isNonEmptyText } from "../../../../../backend/shared/text/non-empty-text";

/**
 * A destructive action that asks in place, as iOS does, instead of a dialog:
 * a soft red button whose text morphs (MorphText) into the question and
 * turns solid red while asking, then into the running label while it runs;
 * ביטול springs out of its side and pushes what is beside it aside
 * (ConfirmCancelButton). cancelSide "end" puts ביטול after the button,
 * "start" before it, for a button at the end of its row (a Facebook
 * account's row, the tasks' selection bar). The caller owns asking, so one
 * question is open at a time.
 *
 * @returns The button and its in-place cancel.
 */
export const InPlaceConfirmButton = ({
  asking,
  label,
  confirmLabel,
  runningLabel,
  running = false,
  disabled,
  size,
  icon,
  ariaLabel,
  cancelSide = "end",
  onAsk,
  onConfirm,
  onCancel,
}: {
  asking: boolean;
  label: string;
  confirmLabel: string;
  runningLabel?: string;
  running?: boolean;
  disabled?: boolean;
  size?: ComponentProps<typeof Button>["size"];
  icon?: ReactNode;
  // For a label that does not say what it acts on, such as הסרה.
  ariaLabel?: string;
  cancelSide?: "start" | "end";
  onAsk: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  let text = asking ? confirmLabel : label;

  if (running && isNonEmptyText(runningLabel)) {
    text = runningLabel;
  }

  const cancel = (
    <ConfirmCancelButton
      show={asking}
      size={size}
      side={cancelSide}
      disabled={disabled}
      onCancel={onCancel}
    />
  );

  return (
    <span className="flex items-center">
      {cancelSide === "start" && cancel}
      <Button
        variant={asking ? "destructive" : "destructive-soft"}
        size={size}
        disabled={disabled}
        aria-label={asking ? undefined : ariaLabel}
        onClick={asking ? onConfirm : onAsk}
      >
        {icon}
        <MorphText>{text}</MorphText>
      </Button>
      {cancelSide === "end" && cancel}
    </span>
  );
};
