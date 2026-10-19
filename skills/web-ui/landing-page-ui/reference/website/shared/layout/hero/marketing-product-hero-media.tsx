import type { ReactNode } from "react";

import { ProductScreenImage } from "../../site/product-screen-image";
import type { ProductScreen } from "../../site/product-screens";
import { marketingProductHeroStyles as styles } from "./marketing-product-hero.styles";

/**
 * Product-hero illustration slot: panel plus centered product visual.
 *
 * @returns The media panel.
 */
export const MarketingProductHeroMedia = ({
  children,
}: {
  children: ReactNode;
}) => (
  <div className={styles.panel}>
    <div className={styles.productVisual}>{children}</div>
  </div>
);

/**
 * A product screen in a hero: decorative unless `alt` describes it.
 *
 * @returns The screen's image.
 */
export const MarketingProductScreenImage = ({
  alt = "",
  fetchPriority,
  screen,
}: {
  alt?: string;
  fetchPriority?: "high";
  screen: ProductScreen;
}) => (
  <ProductScreenImage
    alt={alt}
    decoding="async"
    fetchPriority={fetchPriority}
    screen={screen}
    styles={[styles.productComposite, styles.compactProductComposite]}
  />
);
