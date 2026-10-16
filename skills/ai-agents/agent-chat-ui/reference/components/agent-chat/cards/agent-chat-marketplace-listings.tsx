import { Collapsible } from "@base-ui/react/collapsible";

import {
  app_chat_collected,
  app_chat_collected_of,
  app_chat_listing_count,
  app_chat_marketplace_free,
  app_chat_one_listing,
  app_chat_search_failed,
  app_tool_search_marketplace,
} from "#/paraglide/messages";
import { agentChatToolIcon } from "@/components/agent-chat/work/agent-chat-answer-work";
import {
  AgentChatToolBody,
  AgentChatToolHeader,
} from "@/components/agent-chat/work/agent-chat-tool";
import { GroupProfileAvatar } from "@/components/groups/shared/group-profile-avatar";
import { AppIcon } from "@/components/ui/general/app-icon";
import { NumberFlowMessage } from "@/components/ui/general/number-flow-message";
import { agentChatToolRunning } from "@/lib/agent-chat/conversation/agent-chat-messages";
import type {
  AgentChatMessage,
  AgentChatToolPart,
} from "@/lib/agent-chat/conversation/agent-chat-messages";
import type { SiteSearchProgress } from "@/server/sites/site-search-pages.server";

import type { MarketplaceListingSummary } from "../../../../backend/marketplace/marketplace-contract";
import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

// One listing, as the group search card shows a group: its photo, its title
// (opening the listing on Facebook), and its price and city.
const AgentChatMarketplaceListingRow = ({
  listing,
}: {
  listing: Pick<
    MarketplaceListingSummary,
    "id" | "title" | "price" | "formattedPrice" | "photoUrl" | "url"
  > & { place: string | null };
}) => (
  <div className="agent-chat-group-result">
    <GroupProfileAvatar photoUrl={listing.photoUrl} />
    <div className="agent-chat-group-result-body">
      <a
        href={listing.url}
        target="_blank"
        rel="noopener noreferrer"
        className="agent-chat-group-result-name"
      >
        <bdi>{listing.title}</bdi>
        <AppIcon icon="agent-arrow-up-right" />
      </a>
      <span className="agent-chat-group-result-meta">
        <span>
          {listing.price === 0
            ? app_chat_marketplace_free()
            : listing.formattedPrice}
        </span>
        {isNonEmptyText(listing.place) && <span aria-hidden="true">·</span>}
        {isNonEmptyText(listing.place) && <bdi>{listing.place}</bdi>}
      </span>
    </div>
  </div>
);

/**
 * The listings a Marketplace search or listing read found, under its row.
 *
 * @returns The listing rows, or nothing when there are none.
 */
export const AgentChatMarketplaceListings = ({
  listings,
}: {
  listings: (Pick<
    MarketplaceListingSummary,
    "id" | "title" | "price" | "formattedPrice" | "photoUrl" | "url"
  > & { place: string | null })[];
}) => {
  if (listings.length > 0) {
    return (
      <div className="agent-chat-group-search-results">
        {listings.map((listing) => (
          <AgentChatMarketplaceListingRow key={listing.id} listing={listing} />
        ))}
      </div>
    );
  }

  return null;
};

type MarketplaceSearchPart = Extract<
  AgentChatToolPart,
  { type: "tool-searchFacebookMarketplace" }
>;

// While the search runs, how many listings it collected so far, out of the
// number asked when there is one; the counts roll to each new value.
const AgentChatMarketplaceCollected = ({
  found,
  asked,
}: {
  found: number;
  asked: number | null;
}) => {
  if (asked === null) {
    return (
      <NumberFlowMessage message={app_chat_collected} values={{ found }} />
    );
  }

  return (
    <NumberFlowMessage
      message={app_chat_collected_of}
      values={{ found, total: asked }}
    />
  );
};

// Once done, how many listings it found.
const AgentChatListingCount = ({ count }: { count: number }) => {
  if (count === 1) {
    return <>{app_chat_one_listing()}</>;
  }

  return (
    <NumberFlowMessage message={app_chat_listing_count} values={{ count }} />
  );
};

// Each listing once, in the order the searches found them.
const agentChatSearchedListings = (parts: readonly MarketplaceSearchPart[]) => {
  const listings = new Map<
    string,
    Extract<
      MarketplaceSearchPart,
      { state: "output-available" }
    >["output"]["listings"][number]
  >();

  for (const part of parts) {
    if (part.state === "output-available") {
      for (const listing of part.output.listings) {
        if (!listings.has(listing.id)) {
          listings.set(listing.id, listing);
        }
      }
    }
  }

  return [...listings.values()];
};

/**
 * An answer's Marketplace searches as one card, from the moment the first
 * starts: while one runs, how many listings it collected out of the number
 * asked (its progress); once done, every search's listings in the same
 * card, each once, rising in one after another; a search that failed says
 * so. Before, the chat showed a loader, then a card per search: 20 and 1
 * for one request (the owner, 2026-10-16).
 *
 * @returns The card.
 */
export const AgentChatMarketplaceSearchCard = ({
  part: shown,
  message,
  progress,
}: {
  part: MarketplaceSearchPart;
  message: AgentChatMessage;
  progress: (toolCallId: string) => SiteSearchProgress | undefined;
}) => {
  // Every Marketplace search of the answer shows in its first one's card.
  const parts = message.parts.filter(
    (item): item is MarketplaceSearchPart => item.type === shown.type
  );

  if (parts[0] !== shown) {
    return null;
  }

  const part = parts.find((search) => agentChatToolRunning(search.state));
  const running = part !== undefined;
  const listings = agentChatSearchedListings(parts);
  const failed = parts.every((search) => search.state === "output-error");
  const asked = part?.input?.maxResults ?? null;

  return (
    <Collapsible.Root className="agent-chat-tool" defaultOpen>
      <AgentChatToolHeader
        icon={<AppIcon icon={agentChatToolIcon(shown)} />}
        title={app_tool_search_marketplace()}
        running={running}
      >
        <span
          className="app-tag agent-chat-badge"
          data-variant="count"
        >
          {running && (
            <AgentChatMarketplaceCollected
              found={progress(part.toolCallId)?.found ?? 0}
              asked={asked}
            />
          )}
          {!running && failed && app_chat_search_failed()}
          {!(running || failed) && (
            <AgentChatListingCount count={listings.length} />
          )}
        </span>
      </AgentChatToolHeader>
      {listings.length > 0 && (
        <AgentChatToolBody>
          <AgentChatMarketplaceListings
            listings={listings.map((listing) => ({
              ...listing,
              place: listing.city,
            }))}
          />
        </AgentChatToolBody>
      )}
    </Collapsible.Root>
  );
};
