import { domAnimation, LazyMotion } from "motion/react";

import {
  hero_description,
  hero_product,
  hero_title_accent,
  hero_title_lead,
} from "#/paraglide/messages";

import { MarketingHeroContent } from "../../../shared/layout/hero/marketing-hero-content";
import {
  MarketingProductHeroMedia,
  MarketingProductScreenImage,
} from "../../../shared/layout/hero/marketing-product-hero-media";
import { MarketingAppActions } from "../../../shared/layout/page/marketing-app-actions";
import { productScreens } from "../../../shared/site/product-screens";
import { layouts } from "../../../shared/styles/layouts";
import { cn } from "../../../shared/styles/site-class-merge";
import { homeProductSectionStyles as productStyles } from "../motion/home-product-section.styles";
import { homeHeroStyles } from "./home-hero.styles";

/**
 * The home page's hero: the title revealed letter by letter, the description,
 * the app's sign-up and log-in, and the agent's chat screen.
 *
 * @returns The hero.
 */
export const HomeHero = () => (
  <LazyMotion features={domAnimation} strict>
    <div
      data-product="App"
      className={cn(productStyles.container, homeHeroStyles.container)}
    >
      <div className={homeHeroStyles.card}>
        <section
          data-alternate-styling="false"
          data-full-width="false"
          className={cn(productStyles.section, homeHeroStyles.section)}
        >
          <div className={layouts.contentNarrow}>
            <MarketingHeroContent
              actions={
                <MarketingAppActions className={homeHeroStyles.compactFull} />
              }
              description={hero_description()}
              eyebrow={
                <>
                  <img
                    alt=""
                    aria-hidden="true"
                    height={28}
                    src="/brand/app-logo.webp"
                    width={28}
                    className={homeHeroStyles.productIcon}
                  />
                  {hero_product()}
                </>
              }
              media={
                <MarketingProductHeroMedia>
                  <MarketingProductScreenImage
                    fetchPriority="high"
                    screen={productScreens.agentChat}
                  />
                </MarketingProductHeroMedia>
              }
              titleAccent={hero_title_accent()}
              titleLead={hero_title_lead()}
            />
          </div>
        </section>
      </div>
    </div>
  </LazyMotion>
);
