import {
  BookOpen01Icon,
  HelpCircleIcon,
} from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

interface HelpSearchIconProps {
  kind: "question" | "topic";
}

/**
 * A help search result's icon: a book for a topic, a question mark for a
 * question.
 *
 * @param props - kind: question or topic.
 * @returns The icon.
 */
export const HelpSearchIcon = ({ kind }: HelpSearchIconProps) => (
  <HugeiconsIcon
    aria-hidden="true"
    icon={kind === "topic" ? BookOpen01Icon : HelpCircleIcon}
    size={32}
    strokeWidth={1.5}
  />
);
