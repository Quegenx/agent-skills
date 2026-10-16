import { Collapsible } from "@base-ui/react/collapsible";
import { absurd } from "effect/Function";
import type { ReactNode } from "react";

import {
  app_chat_group_count,
  app_chat_group_not_read,
  app_chat_group_posts_done,
  app_chat_group_reading,
  app_chat_group_waiting,
  app_chat_groups_progress,
  app_chat_members,
  app_chat_one_group,
  app_chat_one_post,
  app_chat_open_post,
  app_chat_post_count,
  app_tool_list_saved,
  app_tool_search_group_posts,
} from "#/paraglide/messages";
import { AgentChatGroupResultRow } from "@/components/agent-chat/cards/agent-chat-group-search";
import {
  AgentChatToolBody,
  AgentChatToolHeader,
} from "@/components/agent-chat/work/agent-chat-tool";
import { GroupProfileAvatar } from "@/components/groups/shared/group-profile-avatar";
import { ShimmerText } from "@/components/ui/feedback/status/shimmer-text";
import { AppIcon } from "@/components/ui/general/app-icon";
import { NumberFlowMessage } from "@/components/ui/general/number-flow-message";
import { agentChatToolRunning } from "@/lib/agent-chat/conversation/agent-chat-messages";
import type {
  AgentChatGroupResult,
  AgentChatToolPart,
} from "@/lib/agent-chat/conversation/agent-chat-messages";
import { groupNumber } from "@/lib/groups/rows/group-format";
import type { GroupRow } from "@/lib/groups/rows/group-row";
import { useSavedGroups } from "@/lib/groups/saved/saved-group-atoms";
import type { GroupPostSearchProgress } from "@/server/posts/group-post-search.server";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

// The saved groups the agent read (listSavedGroups) and its one-time read of
// their posts (searchGroupPosts), as cards built like the group search card
// (AgentChatGroupSearchCard): the same rows as the groups pages, with each
// group's photo, privacy and members from the user's saved groups
// (useSavedGroups). While the posts are read, each group's state and count
// come from the search's progress (AgentChatGroupPostsProgress); once it
// ends, from its output.

// Counts roll to each new value as the search reads (NumberFlowMessage).
const AgentChatGroupCount = ({ count }: { count: number }) => {
  if (count === 1) {
    return <>{app_chat_one_group()}</>;
  }

  return (
    <NumberFlowMessage message={app_chat_group_count} values={{ count }} />
  );
};

const AgentChatPostCount = ({ count }: { count: number }) => {
  if (count === 1) {
    return <>{app_chat_one_post()}</>;
  }

  return <NumberFlowMessage message={app_chat_post_count} values={{ count }} />;
};

// A saved group as the group rows show it; one no longer saved keeps what the
// tool read.
const agentChatSavedGroupResult = (
  group: { id: string; name: string; url: string },
  saved: GroupRow | undefined
): AgentChatGroupResult => {
  const members =
    saved?.details?.memberCount ?? saved?.memberCountApproximate ?? null;

  return {
    id: group.id,
    url: saved?.url ?? group.url,
    name: saved?.name ?? group.name,
    photoUrl: saved?.profilePhotoUrl ?? null,
    privacy: saved?.privacy ?? null,
    members:
      members === null
        ? null
        : app_chat_members({ count: groupNumber(members) }),
    activity: null,
  };
};

const useSavedGroupsById = () =>
  new Map(useSavedGroups().map((group) => [group.id, group]));

type SavedGroupsPart = Extract<
  AgentChatToolPart,
  { type: "tool-listSavedGroups" }
>;

// A card's rows of groups under its header.
const AgentChatGroupRows = ({ children }: { children: ReactNode }) => (
  <AgentChatToolBody>
    <div className="agent-chat-group-search-results">{children}</div>
  </AgentChatToolBody>
);

/**
 * The saved groups a tool listed, as a collapsible tool card with each group's
 * row.
 *
 * @param props - part: the tool call's part.
 * @returns The card.
 */
export const AgentChatSavedGroupsCard = ({
  part,
}: {
  part: SavedGroupsPart;
}) => {
  const savedById = useSavedGroupsById();
  const running = agentChatToolRunning(part.state);
  const groups = part.state === "output-available" ? part.output : [];

  return (
    <Collapsible.Root className="agent-chat-tool">
      <AgentChatToolHeader
        icon={<AppIcon icon="bookmark" />}
        title={app_tool_list_saved()}
        running={running}
      >
        {!running && (
          <span
            className="app-tag agent-chat-badge"
            data-variant="count"
          >
            <AgentChatGroupCount count={groups.length} />
          </span>
        )}
      </AgentChatToolHeader>
      <AgentChatGroupRows>
        {groups.map((group) => (
          <AgentChatGroupResultRow
            key={group.id}
            result={agentChatSavedGroupResult(group, savedById.get(group.id))}
          />
        ))}
      </AgentChatGroupRows>
    </Collapsible.Root>
  );
};

type GroupPostsPart = Extract<
  AgentChatToolPart,
  { type: "tool-searchGroupPosts" }
>;

interface AgentChatGroupPostsGroup extends GroupPostSearchProgress {
  posts: { id: string; url: string; author: string | null; text: string }[];
}

// Each group as the card shows it: from the output once the search ends,
// from its progress while it reads.
const agentChatGroupPostsGroups = (
  part: GroupPostsPart,
  progress: GroupPostSearchProgress[] | undefined
): AgentChatGroupPostsGroup[] => {
  if (part.state === "output-available") {
    return part.output.groups.map((group) => ({
      groupId: group.groupId,
      name: group.name,
      url: `https://www.facebook.com/groups/${group.groupId}`,
      postsRead: group.posts.length,
      state: group.error === null ? "done" : "failed",
      posts: group.posts.map((post) => ({
        id: post.id,
        url: post.url,
        author: post.author,
        text: post.text ?? "",
      })),
    }));
  }

  return (progress ?? []).map((group) => ({ ...group, posts: [] }));
};

// What a group's row says under its name: its state while it waits or
// reads, then how many posts were read (opening them) or that it failed.
const AgentChatGroupPostsState = ({
  group,
}: {
  group: AgentChatGroupPostsGroup;
}) => {
  switch (group.state) {
    case "waiting": {
      return <span>{app_chat_group_waiting()}</span>;
    }

    case "reading": {
      return group.postsRead > 0 ? (
        <span>
          <AgentChatPostCount count={group.postsRead} />
        </span>
      ) : (
        <ShimmerText tone="muted">{app_chat_group_reading()}</ShimmerText>
      );
    }

    case "failed": {
      return <span>{app_chat_group_not_read()}</span>;
    }

    case "done": {
      return group.posts.length > 0 ? (
        <Collapsible.Trigger className="agent-chat-group-posts-toggle">
          <AgentChatPostCount count={group.postsRead} />
          <span className="agent-chat-collapsible-chevron">
            <AppIcon icon="agent-chevron-right" />
          </span>
        </Collapsible.Trigger>
      ) : (
        <span>
          <AgentChatPostCount count={group.postsRead} />
        </span>
      );
    }

    default: {
      return absurd<never>(group.state);
    }
  }
};

// One group, laid out as the group search's rows: its photo, its name
// (opening the group on Facebook) and its state; once read, the count opens
// to the posts, each with its first two lines and a link to it. The panel
// holds one padded box, as AgentChatToolBody does, so its height animates
// from 0 like the cards' own panels. Post text keeps its own direction (bdi)
// inside the page's.
const AgentChatGroupPostsRow = ({
  group,
  saved,
}: {
  group: AgentChatGroupPostsGroup;
  saved: GroupRow | undefined;
}) => (
  <Collapsible.Root className="agent-chat-group-result">
    <GroupProfileAvatar photoUrl={saved?.profilePhotoUrl ?? null} />
    <div className="agent-chat-group-result-body">
      <a
        href={saved?.url ?? group.url}
        target="_blank"
        rel="noopener noreferrer"
        className="agent-chat-group-result-name"
      >
        <bdi>{saved?.name ?? group.name}</bdi>
        <AppIcon icon="agent-arrow-up-right" />
      </a>
      <span className="agent-chat-group-result-meta">
        <AgentChatGroupPostsState group={group} />
      </span>
      <Collapsible.Panel className="collapsible-panel">
        <div className="agent-chat-group-posts">
          {group.posts.map((post) => (
            <div key={post.id} className="agent-chat-group-post">
              <p className="agent-chat-group-post-text">
                {isNonEmptyText(post.author) && (
                  <strong>
                    <bdi>{post.author}</bdi>:{" "}
                  </strong>
                )}
                <bdi>{post.text}</bdi>
              </p>
              <a href={post.url} target="_blank" rel="noopener noreferrer">
                {app_chat_open_post()}
              </a>
            </div>
          ))}
        </div>
      </Collapsible.Panel>
    </div>
  </Collapsible.Root>
);

/**
 * The posts a group read found, group by group, as a collapsible tool card with
 * each group's progress while it reads.
 *
 * @param props - part: the tool call's part; progress: each group's read so
 *   far, while it runs.
 * @returns The card.
 */
export const AgentChatGroupPostsCard = ({
  part,
  progress,
}: {
  part: GroupPostsPart;
  progress: GroupPostSearchProgress[] | undefined;
}) => {
  const savedById = useSavedGroupsById();
  const running = agentChatToolRunning(part.state);
  const groups = agentChatGroupPostsGroups(part, progress);

  const finished = groups.filter(
    (group) => group.state === "done" || group.state === "failed"
  ).length;

  const posts = groups.reduce((sum, group) => sum + group.postsRead, 0);

  return (
    <Collapsible.Root className="agent-chat-tool">
      <AgentChatToolHeader
        icon={<AppIcon icon="posts" />}
        title={
          running ? app_tool_search_group_posts() : app_chat_group_posts_done()
        }
        running={running}
      >
        {groups.length > 0 && (
          <span
            className="app-tag agent-chat-badge"
            data-variant="count"
          >
            {running ? (
              <NumberFlowMessage
                message={app_chat_groups_progress}
                values={{ done: finished, total: groups.length }}
              />
            ) : (
              <AgentChatGroupCount count={groups.length} />
            )}
          </span>
        )}
        {groups.length > 0 && (
          <span
            className="app-tag agent-chat-badge"
            data-variant="count"
          >
            <AgentChatPostCount count={posts} />
          </span>
        )}
      </AgentChatToolHeader>
      <AgentChatGroupRows>
        {groups.map((group) => (
          <AgentChatGroupPostsRow
            key={group.groupId}
            group={group}
            saved={savedById.get(group.groupId)}
          />
        ))}
      </AgentChatGroupRows>
    </Collapsible.Root>
  );
};
