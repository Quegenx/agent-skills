import type { IconSvgElement } from "@hugeicons/react";

interface ProductMarketToken {
  icon: IconSvgElement;
  name: string;
}

/**
 * A product card's content: its label, title, description and feature tokens.
 */
export interface ProductMarket {
  description: string;
  label: string;
  title: string;
  tokenOverflow?: number;
  tokens: readonly ProductMarketToken[];
}
