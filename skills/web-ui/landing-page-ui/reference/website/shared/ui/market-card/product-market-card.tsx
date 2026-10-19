import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import { div as MotionDiv } from "motion/react-m";

import { product_card_more } from "#/paraglide/messages";

import { cn } from "../../styles/site-class-merge";
import { typography } from "../../styles/typography";
import type { ProductMarket } from "./product-market-data";

const tokenGroupVariants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.1, staggerChildren: 0.05 } },
} as const;

const tokenVariants = {
  hidden: { filter: "blur(4px)", opacity: 0, y: 4 },
  visible: {
    filter: "blur(0px)",
    opacity: 1,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
    y: 0,
  },
} as const;

interface ProductMarketCardStyles {
  badge: string;
  body: string;
  card: string;
  description: string;
  header: string;
  label: string;
  overflowBadge: string;
  title: string;
  titleBlock: string;
  tokenIcon: string;
  tokenName: string;
  tokens: string;
}

interface ProductMarketCardProps {
  market: ProductMarket;
  semantic?: "article" | "div";
  styles: ProductMarketCardStyles;
  tokenDirection?: "ltr";
  withTypography?: boolean;
}

/**
 * A product card: its label, title, description and feature tokens, revealed on
 * scroll.
 *
 * @param props - market: the card's content; semantic: its element; styles;
 *   tokenDirection; withTypography: whether to apply the card typography.
 * @returns The card.
 */
export const ProductMarketCard = ({
  market,
  semantic = "div",
  styles,
  tokenDirection,
  withTypography = false,
}: ProductMarketCardProps) => {
  const prefersReducedMotion = useReducedMotion();
  const Card = semantic;

  return (
    <Card className={styles.card}>
      <div className={styles.body}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <span
              className={cn(withTypography && typography.label, styles.label)}
            >
              {market.label}
            </span>
            <h3
              className={cn(
                withTypography && typography.marketingCardTitle,
                styles.title
              )}
            >
              {market.title}
            </h3>
          </div>
          <p
            className={cn(
              withTypography && typography.marketingBodyCompact,
              styles.description
            )}
          >
            {market.description}
          </p>
        </div>
      </div>
      <MotionDiv
        initial={prefersReducedMotion === true ? "visible" : "hidden"}
        variants={tokenGroupVariants}
        viewport={{ margin: "-40px", once: true }}
        whileInView="visible"
        className={styles.tokens}
      >
        {market.tokens.map((marketToken) => (
          <MotionDiv key={marketToken.name} variants={tokenVariants}>
            <span dir={tokenDirection} className={styles.badge}>
              <HugeiconsIcon
                aria-hidden="true"
                icon={marketToken.icon}
                size={18}
                strokeWidth={1.6}
                className={styles.tokenIcon}
              />
              <span
                className={cn(
                  withTypography && typography.label,
                  styles.tokenName
                )}
              >
                {marketToken.name}
              </span>
            </span>
          </MotionDiv>
        ))}
        {market.tokenOverflow !== undefined && market.tokenOverflow !== 0 ? (
          <MotionDiv variants={tokenVariants}>
            <span
              dir={tokenDirection}
              className={cn(styles.badge, styles.overflowBadge)}
            >
              <span
                className={cn(
                  withTypography && typography.label,
                  styles.tokenName
                )}
              >
                +{market.tokenOverflow} {product_card_more()}
              </span>
            </span>
          </MotionDiv>
        ) : null}
      </MotionDiv>
    </Card>
  );
};
