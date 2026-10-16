import { Collapsible } from "@base-ui/react/collapsible";

import {
  app_chat_group_search_done,
  app_chat_one_result,
  app_chat_result_count,
  app_chat_searching_groups,
} from "#/paraglide/messages";
import {
  AgentChatToolBody,
  AgentChatToolHeader,
} from "@/components/agent-chat/work/agent-chat-tool";
import { GroupProfileAvatar } from "@/components/groups/shared/group-profile-avatar";
import { GroupPrivacyBadge } from "@/components/groups/shared/group-status-badge";
import { SavedGroupButton } from "@/components/groups/shared/saved-group-button";
import { ShimmerText } from "@/components/ui/feedback/status/shimmer-text";
import { AppIcon } from "@/components/ui/general/app-icon";
import { IconSwap } from "@/components/ui/general/icon-swap";
import { NumberFlowMessage } from "@/components/ui/general/number-flow-message";
import { agentChatToolRunning } from "@/lib/agent-chat/conversation/agent-chat-messages";
import type {
  AgentChatGroupResult,
  AgentChatGroupSearch,
} from "@/lib/agent-chat/conversation/agent-chat-messages";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

// The count rolls to each new value as results come in (NumberFlowMessage).
const AgentChatResultCount = ({ count }: { count: number }) => {
  if (count === 1) {
    return <>{app_chat_one_result()}</>;
  }

  return (
    <NumberFlowMessage message={app_chat_result_count} values={{ count }} />
  );
};

/**
 * One group in the results, as the groups pages show it: its photo, its
 * name (opening the group on Facebook), privacy, members and activity, and the same
 * save button, inside the row. Facebook's own summary line is left out, as
 * on the groups pages: it is in the Facebook account's language and repeats
 * the privacy and members shown here.
 *
 * @returns The group's row.
 */
export const AgentChatGroupResultRow = ({
  result,
}: {
  result: AgentChatGroupResult;
}) => (
  <div className="agent-chat-group-result">
    <GroupProfileAvatar photoUrl={result.photoUrl} />
    <div className="agent-chat-group-result-body">
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="agent-chat-group-result-name"
      >
        <bdi>{result.name}</bdi>
        <AppIcon icon="agent-arrow-up-right" />
      </a>
      <span className="agent-chat-group-result-meta">
        <GroupPrivacyBadge privacy={result.privacy} />
        {isNonEmptyText(result.members) && <span>{result.members}</span>}
        {isNonEmptyText(result.members) && isNonEmptyText(result.activity) && (
          <span aria-hidden="true">·</span>
        )}
        {isNonEmptyText(result.activity) && <span>{result.activity}</span>}
      </span>
    </div>
    <SavedGroupButton groupId={result.id} groupName={result.name} />
  </div>
);

/**
 * The group search, laid out as a web search tool: the queries as
 * pills (each spinning until its results are in), and the groups found in a
 * scrolling list, each row with its save button. While it runs, the list
 * shows placeholder rows.
 *
 * @returns The search card, collapsible.
 */
export const AgentChatGroupSearchCard = ({
  search,
}: {
  search: AgentChatGroupSearch;
}) => {
  const running = agentChatToolRunning(search.state);
  const results = search.searches.flatMap((item) => item.results);

  return (
    <Collapsible.Root className="agent-chat-tool">
      <AgentChatToolHeader
        icon={<AppIcon icon="agent-users" />}
        title={
          running ? app_chat_searching_groups() : app_chat_group_search_done()
        }
        running={running}
      >
        <span
          className="app-tag agent-chat-badge"
          data-variant="count"
        >
          <AppIcon icon="agent-search" />
          <AgentChatResultCount count={results.length} />
        </span>
      </AgentChatToolHeader>
      <AgentChatToolBody>
        <div className="agent-chat-group-search-queries">
          {search.searches.map((item) => (
            <span
              key={item.query}
              className="app-tag agent-chat-badge"
              data-variant="query"
              data-done={!running || item.done || undefined}
            >
              <IconSwap
                icon={running && item.done ? "agent-check" : "agent-search"}
              />
              {running && !item.done ? (
                <ShimmerText>{item.query}</ShimmerText>
              ) : (
                item.query
              )}
            </span>
          ))}
        </div>
        <div className="agent-chat-group-search-results">
          {results.map((result) => (
            <AgentChatGroupResultRow key={result.url} result={result} />
          ))}
        </div>
      </AgentChatToolBody>
    </Collapsible.Root>
  );
};
