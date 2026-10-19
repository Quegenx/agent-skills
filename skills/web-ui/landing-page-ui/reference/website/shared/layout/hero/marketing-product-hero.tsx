import type { ReactNode } from "react";

import type { ProductScreen } from "../../site/product-screens";
import { MarketingAppActions } from "../page/marketing-app-actions";
import { MarketingSection } from "../page/marketing-section";
import { MarketingHeroBrandEyebrow } from "./marketing-hero-brand-eyebrow";
import { MarketingHeroContent } from "./marketing-hero-content";
import {
  MarketingProductHeroMedia,
  MarketingProductScreenImage,
} from "./marketing-product-hero-media";
import { marketingProductHeroStyles as styles } from "./marketing-product-hero.styles";

interface MarketingProductHeroProps {
  description: ReactNode;
  eyebrow: string;
  screen: ProductScreen;
  screenAlt?: string;
  titleAccent?: string;
  titleLead: string;
}

/**
 * Product-page hero: app sign-up/log-in, brand eyebrow, and media slot.
 *
 * @returns The hero.
 */
export const MarketingProductHero = ({
  description,
  eyebrow,
  screen,
  screenAlt,
  titleAccent,
  titleLead,
}: MarketingProductHeroProps) => (
  <MarketingSection
    innerClassName={styles.inner}
    sectionClassName={styles.section}
  >
    <MarketingHeroContent
      actions={<MarketingAppActions className={styles.ctaWidth} />}
      description={description}
      eyebrow={<MarketingHeroBrandEyebrow label={eyebrow} />}
      media={
        <MarketingProductHeroMedia>
          <MarketingProductScreenImage alt={screenAlt} screen={screen} />
        </MarketingProductHeroMedia>
      }
      titleAccent={titleAccent}
      titleLead={titleLead}
      titleClassName={styles.title}
    />
  </MarketingSection>
);
