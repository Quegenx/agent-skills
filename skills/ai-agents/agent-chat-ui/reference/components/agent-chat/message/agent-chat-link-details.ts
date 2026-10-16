import { createContext } from "react";

import type {
  AgentChatMessage,
  AgentChatMessagePart,
} from "@/lib/agent-chat/conversation/agent-chat-messages";

import type { RealEstateListing } from "../../../../backend/listings/real-estate/real-estate-contract";
import type { Yad2Item } from "../../../../backend/listings/yad2/yad2-classifieds-contract";

/**
 * What a link's preview shows for something the agent found: its photo, its
 * title, and its price and place.
 */
export interface AgentChatLinkDetails {
  imageUrl: string | null;
  title: string;
  detail: string | null;
}

/**
 * A link as the tools and the answer write it alike: the host without
 * "www." and the path without its last slash ("…/item/5001/" and
 * "…/item/5001" are one listing).
 *
 * @param url - The link.
 * @returns Its key.
 */
export const agentChatLinkKey = (url: string) => {
  if (!URL.canParse(url)) {
    return url;
  }

  const { hostname, pathname } = new URL(url);

  return `${hostname.replace(/^www\./u, "")}${pathname.replace(/\/$/u, "")}`;
};

const agentChatShekels = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

const joinDetail = (parts: readonly (string | null)[]) =>
  parts.filter((part) => part !== null && part !== "").join(" · ") || null;

const shekels = (price: number | null) =>
  price === null ? null : agentChatShekels.format(price);

type FoundLink = readonly [string, AgentChatLinkDetails];

const yad2ItemLink = (item: Yad2Item): FoundLink => [
  item.url,
  {
    imageUrl: item.photos[0] ?? null,
    title: item.title,
    detail: joinDetail([shekels(item.price), item.place]),
  },
];

const realEstateLink = (listing: RealEstateListing): FoundLink => [
  listing.url,
  {
    imageUrl: listing.photos[0] ?? null,
    title:
      joinDetail([listing.street ?? listing.neighborhood, listing.city]) ??
      listing.url,
    detail: shekels(listing.price),
  },
];

// The links one finished tool call found, with what each shows.
const partLinks = (part: AgentChatMessagePart): FoundLink[] => {
  if (!("state" in part) || part.state !== "output-available") {
    return [];
  }

  if (part.type === "tool-searchFacebookMarketplace") {
    return part.output.listings.map((listing) => [
      listing.url,
      {
        imageUrl: listing.photoUrl,
        title: listing.title,
        detail: joinDetail([listing.formattedPrice, listing.city]),
      },
    ]);
  }

  if (part.type === "tool-readMarketplaceListings") {
    return part.output.listings.map((listing) => [
      listing.url,
      {
        imageUrl: listing.photos[0] ?? null,
        title: listing.title,
        detail: joinDetail([listing.formattedPrice, listing.locationText]),
      },
    ]);
  }

  if (part.type === "tool-searchYad2" || part.type === "tool-readYad2Items") {
    return part.output.items.map(yad2ItemLink);
  }

  if (part.type === "tool-readRealEstateListings") {
    return part.output.listings.map(realEstateLink);
  }

  if (part.type === "tool-searchRealEstate") {
    return part.output.sites.flatMap((site) =>
      site.listings.map(realEstateLink)
    );
  }

  return [];
};

/**
 * The details of everything the conversation's searches and reads found
 * that has a page (Marketplace listings, apartments, Yad2 items), by their
 * link (agentChatLinkKey), so a link to one in an answer previews it with
 * its own photo and price instead of a screenshot of a login page.
 *
 * @param messages - The conversation's messages.
 * @returns The details, by link.
 */
export const agentChatLinkDetailsOf = (messages: readonly AgentChatMessage[]) =>
  new Map(
    messages.flatMap((message) =>
      message.parts.flatMap((part) =>
        partLinks(part).map(([url, details]) => [
          agentChatLinkKey(url),
          details,
        ])
      )
    )
  );

/**
 * The conversation's link details (agentChatLinkDetailsOf), for the answer's
 * links; empty outside a conversation.
 */
export const AgentChatLinkDetailsContext = createContext<
  ReadonlyMap<string, AgentChatLinkDetails>
>(new Map());
