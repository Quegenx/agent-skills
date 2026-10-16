import { Collapsible } from "@base-ui/react/collapsible";
import type { ReactNode } from "react";

import { ShimmerText } from "@/components/ui/feedback/status/shimmer-text";
import { AppIcon } from "@/components/ui/general/app-icon";

/**
 * The header of a tool with its own card (the group search): the tool's
 * icon, its name (shimmering while it runs) and badges, with a chevron that
 * turns as the details open.
 *
 * @returns The header, the card's collapsible trigger.
 */
export const AgentChatToolHeader = ({
  icon,
  title,
  running,
  children,
}: {
  icon: ReactNode;
  title: string;
  running: boolean;
  children?: ReactNode;
}) => (
  <Collapsible.Trigger className="agent-chat-tool-trigger">
    <span className="agent-chat-tool-summary">
      {icon}
      {running ? (
        <span className="agent-chat-tool-label">
          <ShimmerText tone="muted">{title}</ShimmerText>
        </span>
      ) : (
        <span className="agent-chat-tool-label">{title}</span>
      )}
      {children}
    </span>
    <span className="agent-chat-collapsible-chevron">
      <AppIcon icon="agent-chevron-right" />
    </span>
  </Collapsible.Trigger>
);

/**
 * The panel of a tool card that opens under its header.
 *
 * @param props - children: the card's content.
 * @returns The panel.
 */
export const AgentChatToolBody = ({ children }: { children: ReactNode }) => (
  <Collapsible.Panel className="collapsible-panel">
    <div className="agent-chat-tool-body">{children}</div>
  </Collapsible.Panel>
);

/**
 * A trigger with a chevron that turns as it opens, and the panel it opens
 * (the work log, the sources, a suggested task's disclosures).
 *
 * @returns The trigger and its panel.
 */
export const AgentChatDisclosure = ({
  className,
  triggerClassName,
  trigger,
  children,
}: {
  className?: string;
  triggerClassName: string;
  trigger: ReactNode;
  children: ReactNode;
}) => (
  <Collapsible.Root className={className}>
    <Collapsible.Trigger className={triggerClassName}>
      {trigger}
      <span className="agent-chat-collapsible-chevron">
        <AppIcon icon="agent-chevron-right" />
      </span>
    </Collapsible.Trigger>
    <Collapsible.Panel className="collapsible-panel">
      {children}
    </Collapsible.Panel>
  </Collapsible.Root>
);
