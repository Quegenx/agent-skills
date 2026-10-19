import {
  contact_description,
  contact_title,
  contact_title_muted,
} from "#/paraglide/messages";

import { ContactForm } from "../../features/contact-form/contact-form";
import { contactFormStyles as styles } from "../../features/contact-form/contact-form.styles";
import { ContactTilePattern } from "../../features/contact-form/contact-tile-pattern";
import {
  MarketingContentSection,
  MarketingContentSectionHeader,
} from "../../shared/layout/page/marketing-content-section";
import { marketingContentSectionStyles } from "../../shared/layout/page/marketing-content-section.styles";
import { MarketingMotionPage } from "../../shared/layout/page/marketing-motion-page";
import { AnimatedSectionHeadingText } from "../../shared/motion/animated-section-heading-text";
import { ScrollReveal } from "../../shared/motion/scroll-reveal";
import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";

/**
 * The contact page: its heading and the contact form.
 *
 * @returns The page.
 */
export const ContactPage = () => (
  <MarketingMotionPage className={styles.main}>
    <MarketingContentSection intro className={styles.section}>
      <div className={styles.sectionLayout}>
        <MarketingContentSectionHeader grouped>
          <ScrollReveal>
            <h1
              className={cn(
                typography.marketingPageHeading,
                marketingContentSectionStyles.heading,
                marketingContentSectionStyles.responsiveHeading
              )}
            >
              <AnimatedSectionHeadingText
                mutedText={contact_title_muted()}
                text={contact_title()}
              />
            </h1>
          </ScrollReveal>
          <ScrollReveal>
            <p
              className={cn(
                typography.marketingContentTitle,
                marketingContentSectionStyles.description
              )}
            >
              {contact_description()}
            </p>
          </ScrollReveal>
        </MarketingContentSectionHeader>
        <div className={styles.formStage}>
          <ContactTilePattern />
          <ScrollReveal className={styles.formReveal}>
            <ContactForm />
          </ScrollReveal>
        </div>
      </div>
    </MarketingContentSection>
  </MarketingMotionPage>
);
