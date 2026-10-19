import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { siteFooterStyles as styles } from "./site-footer.styles";

interface SiteFooterRevealProps {
  children: ReactNode;
}

/**
 * Reveals the footer from under the page as it scrolls to the end, sized to its
 * content.
 *
 * @param props - children: the footer's content.
 * @returns The footer.
 */
export const SiteFooterReveal = ({ children }: SiteFooterRevealProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const content = contentRef.current;

    if (content === null) {
      throw new Error(
        "FOOTER_REVEAL_NOT_MOUNTED: footer reveal content was not mounted"
      );
    }

    const measure = () => {
      setHeight(Math.ceil(content.getBoundingClientRect().height));
    };

    // A window resize that changes the footer's height resizes its content.
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);

    return () => {
      observer.disconnect();
    };
  }, []);

  const shellStyle: CSSProperties = {
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    height,
  };

  const layerStyle: CSSProperties = { height };

  const stickyStyle: CSSProperties = {
    top: `calc(100svh - ${height}px)`,
  };

  return (
    <footer className={styles.revealShell} style={shellStyle}>
      <div className={styles.revealLayer} style={layerStyle}>
        <div className={styles.revealSticky} style={stickyStyle}>
          <div ref={contentRef}>{children}</div>
        </div>
      </div>
    </footer>
  );
};
