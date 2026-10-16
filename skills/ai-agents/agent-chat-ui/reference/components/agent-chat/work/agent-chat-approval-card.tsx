import { Collapsible } from "@base-ui/react/collapsible";
import { useState } from "react";
import type { KeyboardEvent } from "react";

import {
  app_chat_allowed,
  app_chat_denied,
  app_chat_deny,
  app_chat_revise,
  app_chat_revise_placeholder,
  app_chat_revised,
  app_cancel,
  app_confirm,
  app_send,
} from "#/paraglide/messages";
import { Input } from "@/components/ui/forms/fields/input";
import { Button } from "@/components/ui/general/button";
import type {
  AgentChatApproval,
  AgentChatApprovalStatus,
} from "@/lib/agent-chat/conversation/agent-chat-messages";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

const decisionOutcome: Record<
  Exclude<AgentChatApprovalStatus, "pending">,
  string
> = {
  get allowed() {
    return app_chat_allowed();
  },
  get denied() {
    return app_chat_denied();
  },
};

/**
 * An action the agent asks to take, laid out as a suggested-task card: the
 * request, what exactly will happen (its summary, always shown, so nothing
 * starts unseen), and the decisions as the app's own Buttons: app_confirm(),
 * app_chat_revise() and app_chat_deny() (red, destructive-soft). There is no
 * "always allow": an action that asks first asks every time. Escape denies
 * from any of the card's buttons. Once decided, the buttons give way to the
 * decision.
 * With onRevise, the card also offers app_chat_revise(): it opens a one-line
 * note under the buttons (the chat's collapsible panel), and sending it
 * denies the action with the note as the reason, so the agent adjusts it and
 * asks again (Claude Code's "No, and tell Claude what to do differently").
 * Enter sends the note; Escape there closes the note, not the action. A
 * revised card shows app_chat_revised() with its note (revisionNote).
 *
 * @returns The approval card.
 */
export const AgentChatApprovalCard = ({
  approval,
  onDecide,
  onRevise,
  revisionNote,
}: {
  approval: AgentChatApproval;
  onDecide: (status: AgentChatApprovalStatus) => void;
  onRevise?: (note: string) => void;
  revisionNote?: string;
}) => {
  const [revising, setRevising] = useState(false);
  const [note, setNote] = useState("");

  const denyOnEscape = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape" && approval.status === "pending") {
      event.preventDefault();
      onDecide("denied");
    }
  };

  const sendRevision = () => {
    const trimmed = note.trim();

    if (trimmed && onRevise) {
      onRevise(trimmed);
    }
  };

  return (
    <section className="agent-chat-card" aria-label={approval.title}>
      <div className="agent-chat-card-body">
        <h3 className="agent-chat-card-title">
          <bdi>{approval.title}</bdi>
        </h3>
        <p className="agent-chat-card-details">
          <bdi>{approval.summary}</bdi>
        </p>
      </div>
      {approval.status === "pending" ? (
        <div className="agent-chat-card-actions">
          <Button
            size="sm"
            onKeyDown={denyOnEscape}
            onClick={() => {
              onDecide("allowed");
            }}
          >
            {app_confirm()}
          </Button>
          {onRevise && (
            <Button
              variant="secondary"
              size="sm"
              aria-expanded={revising}
              onKeyDown={denyOnEscape}
              onClick={() => {
                setRevising((open) => !open);
              }}
            >
              {app_chat_revise()}
            </Button>
          )}
          <Button
            variant="destructive-soft"
            size="sm"
            onKeyDown={denyOnEscape}
            onClick={() => {
              onDecide("denied");
            }}
          >
            {app_chat_deny()}
          </Button>
        </div>
      ) : (
        <output className="agent-chat-card-outcome">
          {isNonEmptyText(revisionNote) ? (
            <>
              {app_chat_revised()}: <bdi>{revisionNote}</bdi>
            </>
          ) : (
            decisionOutcome[approval.status]
          )}
        </output>
      )}
      {onRevise && approval.status === "pending" && (
        <Collapsible.Root open={revising} onOpenChange={setRevising}>
          <Collapsible.Panel className="collapsible-panel">
            <form
              className="agent-chat-card-revise"
              onSubmit={(event) => {
                event.preventDefault();
                sendRevision();
              }}
            >
              <Input
                ref={(element) => element?.focus()}
                value={note}
                placeholder={app_chat_revise_placeholder()}
                aria-label={app_chat_revise()}
                onChange={(event) => {
                  setNote(event.currentTarget.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setRevising(false);
                  }
                }}
              />
              <Button type="submit" size="sm" disabled={!note.trim()}>
                {app_send()}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setRevising(false);
                }}
              >
                {app_cancel()}
              </Button>
            </form>
          </Collapsible.Panel>
        </Collapsible.Root>
      )}
    </section>
  );
};
