import { marketingProductHeroStyles as styles } from "./marketing-product-hero.styles";

/**
 * App mark plus label used as the product-hero eyebrow.
 *
 * @returns The logo and the label.
 */
export const MarketingHeroBrandEyebrow = ({ label }: { label: string }) => (
  <>
    <img
      alt=""
      aria-hidden="true"
      height="28"
      src="/brand/app-logo.webp"
      width="28"
      className={styles.eyebrowIcon}
    />
    <span>{label}</span>
  </>
);
