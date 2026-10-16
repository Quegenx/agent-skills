import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domMax,
} from "motion/react";
import { span as MotionSpan } from "motion/react-m";
import { useState } from "react";

import {
  app_label_add,
  app_label_add_own,
  app_label_remove,
} from "#/paraglide/messages";
import { TooltipHint } from "@/components/ui/display/tooltip";
import { Button } from "@/components/ui/general/button";
import { AppIcon } from "@/components/ui/general/app-icon";
import { trackingTaskLabelPresets } from "@/lib/tasks/tracking-task-labels";
import { trackingTaskLabelMaxLength } from "@/lib/tasks/tracking-task-schema";

// How the user's own labels come and go: as IconSwap's icons (a short spring,
// no bounce), growing in from 80% and back out, while the pills after them
// glide aside (layout) instead of jumping.
const labelPillHidden = { opacity: 0, scale: 0.8 };
const labelPillShown = { opacity: 1, scale: 1 };
const labelPillSpring = { type: "spring", duration: 0.3, bounce: 0 } as const;

/**
 * The label picker: the preset labels as pills that toggle, the
 * task's own labels as pills with a remove button, and a field that adds a
 * new one (Enter or "+", blue once there is something to add). A label
 * already there is not added twice.
 *
 * @returns The label picker.
 */
export const TrackingTaskLabelsField = ({
  id,
  value,
  onChange,
}: {
  id: string;
  value: readonly string[];
  onChange: (labels: string[]) => void;
}) => {
  const [draft, setDraft] = useState("");
  const chosen = new Set(value);
  const presets = new Set<string>(trackingTaskLabelPresets());
  const custom = value.filter((label) => !presets.has(label));

  const add = () => {
    const label = draft.trim();

    if (label && !chosen.has(label)) {
      onChange([...value, label]);
    }

    setDraft("");
  };

  return (
    <div className="tracking-task-labels-field">
      <div className="tracking-task-label-pills">
        {trackingTaskLabelPresets().map((label) => (
          <button
            key={label}
            type="button"
            className="tracking-task-label-pill"
            aria-pressed={chosen.has(label)}
            onClick={() => {
              onChange(
                chosen.has(label)
                  ? value.filter((item) => item !== label)
                  : [...value, label]
              );
            }}
          >
            {label}
          </button>
        ))}
        <LazyMotion features={domMax} strict>
          <MotionConfig reducedMotion="user">
            <AnimatePresence initial={false} mode="popLayout">
              {custom.map((label) => (
                <MotionSpan
                  key={label}
                  layout
                  className="tracking-task-label-pill"
                  data-custom
                  initial={labelPillHidden}
                  animate={labelPillShown}
                  exit={labelPillHidden}
                  transition={labelPillSpring}
                >
                  <bdi>{label}</bdi>
                  <TooltipHint label={app_label_remove({ label })}>
                    <button
                      type="button"
                      aria-label={app_label_remove({ label })}
                      onClick={() => {
                        onChange(value.filter((item) => item !== label));
                      }}
                    >
                      <AppIcon icon="agent-close" />
                    </button>
                  </TooltipHint>
                </MotionSpan>
              ))}
            </AnimatePresence>
          </MotionConfig>
        </LazyMotion>
      </div>
      <div className="tracking-task-label-add">
        <input
          id={id}
          className="app-input"
          placeholder={app_label_add_own()}
          maxLength={trackingTaskLabelMaxLength}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <TooltipHint label={app_label_add()}>
          <Button
            size="icon"
            variant={draft.trim() ? "default" : "secondary"}
            aria-label={app_label_add()}
            disabled={!draft.trim()}
            onClick={add}
          >
            <AppIcon icon="agent-plus" />
          </Button>
        </TooltipHint>
      </div>
    </div>
  );
};
