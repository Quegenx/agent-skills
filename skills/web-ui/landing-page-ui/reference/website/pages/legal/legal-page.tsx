import { useHydrated } from "@tanstack/react-router";
import { domMax, LazyMotion, useInView, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { articleProseStyles } from "../../shared/layout/content/article-prose.styles";
import { inlineContentLinkStyles } from "../../shared/layout/content/inline-content-link.styles";
import { MarketingPageHeader } from "../../shared/layout/page/marketing-page-header";
import { marketingPageStyles } from "../../shared/layout/page/marketing-page.styles";
import { AnimatedTitleText } from "../../shared/motion/animated-title-text";
import {
  ScrollReveal,
  ScrollRevealSeparator,
} from "../../shared/motion/scroll-reveal";
import { sectionNavigationInViewOptions } from "../../shared/navigation/section-navigation-observer";
import { SideSectionNavigation } from "../../shared/navigation/side-section-navigation";
import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";
import { LegalPageAnimatedWords } from "./legal-page-animated-words";
import { legalPageRevealsSections } from "./legal-page-reveal";
import { legalPageStyles as styles } from "./legal-page.styles";
import type { LegalDocument, LegalDocumentSection } from "./legal-page.types";

interface LegalPageProps {
  document: LegalDocument;
  revealSections?: boolean;
}

const LegalReveal = ({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}): ReactNode => {
  if (enabled) {
    return <ScrollReveal>{children}</ScrollReveal>;
  }

  return children;
};

// Bounded parts keep the search linear.
const emailPattern =
  /(?<email>[\w.+][\w.+-]{0,63}@[\w.-]{1,253}\.[A-Za-z]{2,63})/gu;

const LegalParagraph = ({ text }: { text: string }) => {
  const parts = text.split(emailPattern);

  return (
    <p className={articleProseStyles.flowBlock}>
      {parts.map((part) =>
        emailPattern.test(part) ? (
          <a
            href={`mailto:${part}`}
            key={part}
            className={inlineContentLinkStyles.link}
          >
            {part}
          </a>
        ) : (
          part
        )
      )}
    </p>
  );
};

interface LegalTrackedSectionProps {
  children: ReactNode;
  index: number;
  reveal: boolean;
  section: LegalDocumentSection;
  setActiveSectionIndex: (index: number) => void;
}

const LegalTrackedSection = ({
  children,
  index,
  reveal,
  section,
  setActiveSectionIndex,
}: LegalTrackedSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, sectionNavigationInViewOptions);

  useEffect(() => {
    if (isInView) {
      setActiveSectionIndex(index);
    }
  }, [index, isInView, setActiveSectionIndex]);

  const sectionProps = {
    id: section.id,
    ref: sectionRef,
    className: styles.section,
  };

  const content = <section {...sectionProps}>{children}</section>;

  if (reveal) {
    return <ScrollReveal>{content}</ScrollReveal>;
  }

  return content;
};

/**
 * A legal document's page: its title and intro, its sections with a side
 * navigation following the one in view.
 *
 * @param props - document: the legal document; revealSections: whether sections
 *   reveal on scroll.
 * @returns The page.
 */
export const LegalPage = ({
  document,
  revealSections = false,
}: LegalPageProps) => {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  const shouldRevealSections = legalPageRevealsSections(
    revealSections,
    useHydrated(),
    useReducedMotion()
  );

  return (
    <LazyMotion features={domMax} strict>
      <main
        id="main-content"
        tabIndex={-1}
        className={marketingPageStyles.main}
      >
        <LegalReveal enabled={shouldRevealSections}>
          <MarketingPageHeader>
            <div className={marketingPageStyles.headerTitleGroup}>
              <h1
                className={cn(
                  typography.marketingDisplayTitle,
                  marketingPageStyles.title,
                  styles.title
                )}
              >
                <AnimatedTitleText text={document.title} />
              </h1>
            </div>
            <p
              className={cn(
                typography.marketingContentTitle,
                marketingPageStyles.description
              )}
            >
              <LegalPageAnimatedWords delay={0.5} text={document.updated} />
            </p>
          </MarketingPageHeader>
        </LegalReveal>
        <section className={styles.articleSection}>
          <ScrollRevealSeparator
            aria-hidden="true"
            as="span"
            enabled={shouldRevealSections}
            className={styles.articleSectionRule}
          />
          <div className={styles.articleLayout}>
            <SideSectionNavigation
              activeItemId={document.sections[activeSectionIndex]?.id ?? ""}
              indicatorLayoutId="legal-section-indicator"
              items={document.sections.map((section) => ({
                id: section.id,
                label: section.title,
              }))}
              label={document.title}
              reveal={shouldRevealSections}
            />
            <article
              className={cn(
                typography.body,
                articleProseStyles.body,
                styles.article
              )}
            >
              <LegalReveal enabled={shouldRevealSections}>
                <div className={articleProseStyles.flowBlock}>
                  {document.intro.map((paragraph) => (
                    <LegalParagraph key={paragraph} text={paragraph} />
                  ))}
                </div>
              </LegalReveal>
              <div>
                {document.sections.map((section, index) => (
                  <LegalTrackedSection
                    index={index}
                    key={section.id}
                    reveal={shouldRevealSections}
                    section={section}
                    setActiveSectionIndex={setActiveSectionIndex}
                  >
                    <h2
                      className={cn(
                        typography.heading3,
                        articleProseStyles.sectionHeadingSpacing,
                        styles.sectionTitle
                      )}
                    >
                      {section.title}
                    </h2>
                    {section.paragraphs.map((paragraph) => (
                      <LegalParagraph key={paragraph} text={paragraph} />
                    ))}
                    {section.points ? (
                      <ul
                        className={cn(
                          articleProseStyles.flowBlock,
                          styles.list
                        )}
                      >
                        {section.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    ) : null}
                  </LegalTrackedSection>
                ))}
              </div>
            </article>
          </div>
        </section>
      </main>
    </LazyMotion>
  );
};
