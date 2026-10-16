import {
  app_chat_listing_agency,
  app_chat_listing_rooms,
  app_chat_listing_size,
} from "#/paraglide/messages";
import { GroupProfileAvatar } from "@/components/groups/shared/group-profile-avatar";
import { AppIcon } from "@/components/ui/general/app-icon";
import type { AgentChatToolPart } from "@/lib/agent-chat/conversation/agent-chat-messages";
import { formatListingPrice } from "@/lib/sites/listing-price-format";
import { listingSiteService } from "@/lib/sites/listing-site-labels";

import type { JobPosting } from "../../../../backend/jobs/job-search-contract";
import type { RealEstateListing } from "../../../../backend/listings/real-estate/real-estate-contract";
import type { Yad2Item } from "../../../../backend/listings/yad2/yad2-classifieds-contract";
import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

// What the job and real-estate site tools found, under their row, as the
// Marketplace list shows listings: each one's picture, its title (opening it
// on its site), and a line of what matters, ending with the site's name.

// One row: a picture, a title link and a meta line of the parts present.
const AgentChatSiteResultRow = ({
  photoUrl,
  title,
  url,
  meta,
}: {
  photoUrl: string | null;
  title: string;
  url: string;
  meta: readonly (string | null)[];
}) => (
  <div className="agent-chat-group-result">
    <GroupProfileAvatar photoUrl={photoUrl} />
    <div className="agent-chat-group-result-body">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="agent-chat-group-result-name"
      >
        <bdi>{title}</bdi>
        <AppIcon icon="agent-arrow-up-right" />
      </a>
      <span className="agent-chat-group-result-meta">
        {[...new Set(meta.filter((part): part is string => Boolean(part)))].map(
          (part, index) => (
            <span key={part}>
              {index > 0 && <span aria-hidden="true">· </span>}
              <bdi>{part}</bdi>
            </span>
          )
        )}
      </span>
    </div>
  </div>
);

const AgentChatJobRows = ({ jobs }: { jobs: readonly JobPosting[] }) => {
  if (jobs.length > 0) {
    return (
      <div className="agent-chat-group-search-results">
        {jobs.map((job) => (
          <AgentChatSiteResultRow
            key={`${job.site}:${job.id}`}
            photoUrl={job.companyLogoUrl}
            title={job.title}
            url={job.url}
            meta={[
              job.company,
              job.place,
              job.salary,
              listingSiteService(job.site).name,
            ]}
          />
        ))}
      </div>
    );
  }

  return null;
};

const AgentChatRealEstateRows = ({
  listings,
}: {
  listings: readonly RealEstateListing[];
}) => {
  if (listings.length > 0) {
    return (
      <div className="agent-chat-group-search-results">
        {listings.map((listing) => (
          <AgentChatSiteResultRow
            key={`${listing.site}:${listing.id}`}
            photoUrl={listing.photos[0] ?? null}
            title={
              [listing.street ?? listing.neighborhood, listing.city]
                .filter(Boolean)
                .join(", ") ||
              (isNonEmptyText(listing.propertyType)
                ? listing.propertyType
                : listing.id)
            }
            url={listing.url}
            meta={[
              listing.price === null ? null : formatListingPrice(listing.price),
              listing.rooms === null
                ? null
                : app_chat_listing_rooms({ count: listing.rooms }),
              listing.sizeM2 === null
                ? null
                : app_chat_listing_size({ size: listing.sizeM2 }),
              listing.propertyType,
              listing.isAgency === true ? app_chat_listing_agency() : null,
              listingSiteService(listing.site).name,
            ]}
          />
        ))}
      </div>
    );
  }

  return null;
};

// Yad2's other boards: the price, what it is, where, and its first two
// details (a car's year and hand, a pet's age).
const AgentChatYad2Rows = ({ items }: { items: readonly Yad2Item[] }) => {
  if (items.length > 0) {
    return (
      <div className="agent-chat-group-search-results">
        {items.map((item) => (
          <AgentChatSiteResultRow
            key={`${item.category}:${item.id}`}
            photoUrl={item.photos[0] ?? null}
            title={item.title}
            url={item.url}
            meta={[
              item.price === null ? null : formatListingPrice(item.price),
              item.subtitle,
              ...item.details.slice(0, 2).map((detail) => detail.value),
              item.place,
              listingSiteService("yad2").name,
            ]}
          />
        ))}
      </div>
    );
  }

  return null;
};

/**
 * A finished site tool call's rows (agent-chat-answer-part.tsx); null for
 * any other tool.
 *
 * @returns The rows, or null.
 */
export const AgentChatSiteToolResult = ({
  part,
}: {
  part: AgentChatToolPart;
}) => {
  if (part.state !== "output-available") {
    return null;
  }

  if (part.type === "tool-searchJobs") {
    return (
      <AgentChatJobRows jobs={part.output.sites.flatMap((site) => site.jobs)} />
    );
  }

  if (part.type === "tool-searchRealEstate") {
    return (
      <AgentChatRealEstateRows
        listings={part.output.sites.flatMap((site) => site.listings)}
      />
    );
  }

  if (part.type === "tool-readRealEstateListings") {
    return <AgentChatRealEstateRows listings={part.output.listings} />;
  }

  if (part.type === "tool-searchYad2" || part.type === "tool-readYad2Items") {
    return <AgentChatYad2Rows items={part.output.items} />;
  }

  return null;
};
