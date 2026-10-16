import { HomeBusiness } from "../business/home-business";
import { HomeFaq } from "../faq/home-faq";
import { HomeHero } from "../hero/home-hero";
import { HomePersonal } from "../personal/home-personal";
import { HomePlatform } from "../platform/home-platform";
import { HomeCta } from "./home-cta";

/**
 * The home page: hero, business, personal, platform, FAQ and the closing call
 * to action.
 *
 * @returns The page.
 */
export const HomePage = () => (
  <main id="main-content" tabIndex={-1}>
    <HomeHero />
    <HomeBusiness />
    <HomePersonal />
    <HomePlatform />
    <HomeFaq />
    <HomeCta />
  </main>
);
