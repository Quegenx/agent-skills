import {
  app_ad_performance_score,
  app_ad_run_days,
} from "#/paraglide/messages";
import { adLibraryPerformanceLabels } from "@/components/ads/filters/ad-library-insight-labels";
import {
  adLibraryKindIcons,
  adLibraryKindLabels,
} from "@/components/ads/filters/ad-library-kind-labels";
import { AppIcon } from "@/components/ui/general/app-icon";
import { useFreshAdLibraryAds } from "@/lib/ads/catalog/ad-library-fresh-ads";
import { adLibraryAdThumbnailUrl } from "@/lib/ads/catalog/ad-library-media";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";
import type { AgentAdCard } from "../../../agent/tools/ad-library/ad-library-tool-support";

// One ad the agent found, as a row of the list under its tool: its picture,
// the advertiser (opening the ad in Facebook's Ad Library), the start of
// its text, and its kind, performance and run time. The picture is
// Facebook's own link, which expires after a few days; an expired one is
// replaced by a fresh link once AgentChatAdCards reads it again (keyed by
// its link, so the new picture shows instead of the hidden broken one).
const AgentChatAdCard = ({
  card,
  thumbnailUrl,
}: {
  card: AgentAdCard;
  thumbnailUrl: string | null;
}) => (
  <div className="agent-chat-ad-result">
    <div className="agent-chat-ad-thumb" data-kind={card.kind}>
      {isNonEmptyText(thumbnailUrl) && (
        <img
          key={thumbnailUrl}
          src={thumbnailUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      )}
      <AppIcon icon={adLibraryKindIcons[card.kind]} />
    </div>
    <div className="agent-chat-group-result-body">
      <a
        href={card.libraryUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="agent-chat-group-result-name"
      >
        <bdi>{card.advertiser}</bdi>
        <AppIcon icon="agent-arrow-up-right" />
      </a>
      {card.text && (
        <p className="agent-chat-ad-text">
          <bdi>{card.text}</bdi>
        </p>
      )}
      <span className="agent-chat-group-result-meta">
        <span>{adLibraryKindLabels[card.kind]()}</span>
        {card.performance && card.score !== null && (
          <>
            <span aria-hidden="true">·</span>
            <span>
              {app_ad_performance_score({
                label: adLibraryPerformanceLabels[card.performance].label(),
                score: card.score,
              })}
            </span>
          </>
        )}
        {card.runDays !== null && (
          <>
            <span aria-hidden="true">·</span>
            <span>{app_ad_run_days({ count: card.runDays })}</span>
          </>
        )}
      </span>
    </div>
  </div>
);

/**
 * The ads a tool found or reported on, under its row, as the group search
 * lists its groups: a scrolling list of rows. Results stored before the
 * cards existed have none, and show nothing here. Pictures whose links
 * expired are read again from Facebook (useFreshAdLibraryAds); the server
 * checks which expired, so the list sends every card's ID.
 *
 * @returns The ad rows, or nothing when there are none.
 */
export const AgentChatAdCards = ({
  cards,
  userId,
}: {
  cards: readonly AgentAdCard[] | undefined;
  userId: string;
}) => {
  const shown = cards ?? [];

  // The server checks which pictures expired and reads only those again.
  const fresh = useFreshAdLibraryAds(
    userId,
    shown.map((card) => card.id)
  );

  if (shown.length > 0) {
    return (
      <div className="agent-chat-ad-results">
        {shown.map((card) => {
          const refreshed = fresh.get(card.id);

          return (
            <AgentChatAdCard
              key={card.id}
              card={card}
              thumbnailUrl={
                refreshed
                  ? adLibraryAdThumbnailUrl(refreshed)
                  : card.thumbnailUrl
              }
            />
          );
        })}
      </div>
    );
  }

  return null;
};
