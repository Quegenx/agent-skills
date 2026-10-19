import type { ReactNode } from "react";

import { marketingPageStyles } from "./marketing-page.styles";

/**
 * Provides the shared semantic and responsive header shell for marketing pages.
 *
 * @returns The header.
 */
export const MarketingPageHeader = ({ children }: { children: ReactNode }) => (
  <header className={marketingPageStyles.header}>
    <div className={marketingPageStyles.headerContent}>{children}</div>
  </header>
);
