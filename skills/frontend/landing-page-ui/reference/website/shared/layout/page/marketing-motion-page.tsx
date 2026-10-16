import type { ClassValue } from "cn";
import { domAnimation, LazyMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "../../styles/site-class-merge";
import { marketingPageStyles } from "./marketing-page.styles";

interface MarketingMotionPageProps {
  children: ReactNode;
  className?: ClassValue;
}

/**
 * A marketing page's main element, with motion's features loaded once for the
 * page.
 *
 * @param props - children: the page; className: extra classes.
 * @returns The main element.
 */
export const MarketingMotionPage = ({
  children,
  className,
}: MarketingMotionPageProps) => (
  <LazyMotion features={domAnimation} strict>
    <main
      id="main-content"
      tabIndex={-1}
      className={cn(marketingPageStyles.main, className)}
    >
      {children}
    </main>
  </LazyMotion>
);
