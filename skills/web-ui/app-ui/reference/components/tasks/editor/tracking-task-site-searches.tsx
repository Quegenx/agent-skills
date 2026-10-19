import {
  app_task_site_search_from,
  app_task_site_search_jobs,
  app_task_site_search_remove,
  app_task_site_search_rent,
  app_task_site_search_rooms,
  app_task_site_search_sale,
  app_task_site_search_up_to,
  app_task_site_searches,
  app_task_site_searches_hint,
  app_task_site_searches_none,
  app_yad2_businesses_for_sale,
  app_yad2_cars,
  app_yad2_motorcycles,
  app_yad2_new_projects,
  app_yad2_pets,
  app_yad2_professionals,
  app_yad2_second_hand,
} from "#/paraglide/messages";
import { agentChatFaviconUrl } from "@/components/agent-chat/work/agent-chat-answer-work";
import { TooltipHint } from "@/components/ui/display/tooltip";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/forms/fields/field";
import { AppIcon } from "@/components/ui/general/app-icon";
import { formatListingPrice } from "@/lib/sites/listing-price-format";
import { listingSiteService } from "@/lib/sites/listing-site-labels";
import type { ListingSite } from "@/lib/sites/listing-site-labels";

import type { Yad2Category } from "../../../../backend/listings/yad2/yad2-classifieds-contract";
import type { TaskSiteSearch } from "../../../../backend/sites/task-site-search";

// The task sheet's site searches (TrackingTaskWatchFields): each one's sites
// by their favicons and what it looks for, removable here. The agent adds and
// changes them (createTrackingTask, updateTrackingTask).

const yad2CategoryLabels = {
  cars: app_yad2_cars,
  motorcycles: app_yad2_motorcycles,
  second_hand: app_yad2_second_hand,
  pets: app_yad2_pets,
  professionals: app_yad2_professionals,
  businesses_for_sale: app_yad2_businesses_for_sale,
  new_projects: app_yad2_new_projects,
} satisfies Record<Yad2Category, () => string>;

const priceRangeText = (min: number | undefined, max: number | undefined) =>
  [
    min === undefined
      ? null
      : app_task_site_search_from({ price: formatListingPrice(min) }),
    max === undefined
      ? null
      : app_task_site_search_up_to({ price: formatListingPrice(max) }),
  ]
    .filter(Boolean)
    .join(" ");

const roomsText = (min: number | undefined, max: number | undefined) => {
  if (min === undefined && max === undefined) {
    return null;
  }

  const rooms =
    min !== undefined && max !== undefined && min !== max
      ? `${min}–${max}`
      : String(min ?? max);

  return app_task_site_search_rooms({ rooms });
};

interface TrackingTaskSiteSearchView {
  sites: ListingSite[];
  summary: string;
}

const joinedSummary = (parts: readonly (string | null | undefined)[]) =>
  parts.filter(Boolean).join(" · ");

// The search's sites and its summary in the page's language.
const trackingTaskSiteSearchView = (
  search: TaskSiteSearch
): TrackingTaskSiteSearchView => {
  if (search.kind === "jobs") {
    return {
      sites: [...search.sites],
      summary: joinedSummary([
        app_task_site_search_jobs(),
        search.query,
        search.city,
      ]),
    };
  }

  if (search.kind === "real_estate") {
    return {
      sites: [...search.sites],
      summary: joinedSummary([
        search.dealType === "rent"
          ? app_task_site_search_rent()
          : app_task_site_search_sale(),
        search.city,
        roomsText(search.minRooms, search.maxRooms),
        priceRangeText(search.minPrice, search.maxPrice),
        search.text,
      ]),
    };
  }

  if (search.kind === "yad2") {
    return {
      sites: ["yad2"],
      summary: joinedSummary([
        yad2CategoryLabels[search.category](),
        search.query,
        search.city,
        roomsText(search.minRooms, search.maxRooms),
        priceRangeText(search.minPrice, search.maxPrice),
      ]),
    };
  }

  return {
    sites: ["marketplace"],
    summary: joinedSummary([
      search.query,
      priceRangeText(search.minPrice, search.maxPrice),
    ]),
  };
};

/**
 * A task's site searches: each search with its summary and a remove button, and
 * adding a new one.
 *
 * @param props - searches: the task's site searches; onChange: replaces them.
 * @returns The field.
 */
export const TrackingTaskSiteSearchesField = ({
  searches,
  onChange,
}: {
  searches: readonly TaskSiteSearch[];
  onChange: (searches: TaskSiteSearch[]) => void;
}) => (
  <Field>
    <FieldLabel>{app_task_site_searches()}</FieldLabel>
    {searches.length > 0 ? (
      <ul className="tracking-task-site-searches">
        {searches.map((search) => {
          const { sites, summary } = trackingTaskSiteSearchView(search);
          const remove = app_task_site_search_remove({ search: summary });

          return (
            // A search has no id of its own: its content is its key.
            <li
              key={JSON.stringify(search)}
              className="tracking-task-site-search"
            >
              <span className="tracking-task-site-search-sites">
                {sites.map((site) => {
                  const service = listingSiteService(site);

                  return (
                    <img
                      key={site}
                      src={agentChatFaviconUrl(service.url)}
                      alt={service.name}
                      title={service.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  );
                })}
              </span>
              <bdi>{summary}</bdi>
              <TooltipHint label={remove}>
                <button
                  type="button"
                  aria-label={remove}
                  onClick={() => {
                    onChange(searches.filter((other) => other !== search));
                  }}
                >
                  <AppIcon icon="agent-close" />
                </button>
              </TooltipHint>
            </li>
          );
        })}
      </ul>
    ) : (
      <p className="tracking-task-site-searches-none">
        {app_task_site_searches_none()}
      </p>
    )}
    <FieldDescription>{app_task_site_searches_hint()}</FieldDescription>
  </Field>
);
