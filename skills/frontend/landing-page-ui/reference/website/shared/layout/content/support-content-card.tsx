import type { ReactNode } from "react";
import { Fragment } from "react";

import { ScrollReveal } from "../../motion/scroll-reveal";
import { ProductScreenImage } from "../../site/product-screen-image";
import type { ProductScreen } from "../../site/product-screens";
import { layouts } from "../../styles/layouts";
import { cn } from "../../styles/site-class-merge";
import { SupportContentHeading } from "./support-content-heading";
import { supportContentStyles as styles } from "./support-content.styles";

interface SupportContentCardProps {
  description: string;
  imageAlt: string;
  imageInset?: boolean;
  link: ReactNode;
  reveal?: boolean;
  screen: ProductScreen;
  title: string;
}

/**
 * A support call to action (the FAQ's "still need help", the help center's
 * request): a heading, its link and a screen of the app beside them.
 * reveal fades each part in as it scrolls into view.
 *
 * @returns The support card.
 */
export const SupportContentCard = ({
  description,
  imageAlt,
  imageInset = false,
  link,
  reveal = false,
  screen,
  title,
}: SupportContentCardProps) => {
  const Reveal = reveal ? ScrollReveal : Fragment;

  return (
    <section
      className={cn(
        layouts.centeredColumn,
        layouts.pageBlockPadding,
        styles.section
      )}
    >
      <div className={cn(styles.container, styles.card)}>
        <div className={styles.content}>
          <Reveal>
            <SupportContentHeading description={description} title={title} />
          </Reveal>
          <Reveal>{link}</Reveal>
        </div>
        <Reveal>
          <div className={styles.illustration}>
            <ProductScreenImage
              alt={imageAlt}
              screen={screen}
              styles={[
                styles.illustrationImage,
                imageInset && styles.illustrationImageInset,
              ]}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
};
