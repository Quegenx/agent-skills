import { ProductMarketCard } from "../../../shared/ui/market-card/product-market-card";
import type { ProductMarket } from "../../../shared/ui/market-card/product-market-data";
import { homeBusinessCapabilityCardStyles } from "./home-business-capability-card.styles";

interface HomeBusinessCapabilityCardProps {
  capability: ProductMarket;
}

/**
 * One of the home page's business capability cards.
 *
 * @param props - capability: the capability's title, description, label and
 *   features.
 * @returns The card.
 */
export const HomeBusinessCapabilityCard = ({
  capability,
}: HomeBusinessCapabilityCardProps) => (
  <ProductMarketCard
    market={capability}
    semantic="article"
    styles={homeBusinessCapabilityCardStyles}
    withTypography
  />
);
