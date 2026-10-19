import { cn } from "../../styles/site-class-merge";
import { typography } from "../../styles/typography";
import { supportContentStyles as styles } from "./support-content.styles";

interface SupportContentHeadingProps {
  description: string;
  title: string;
}

/**
 * Renders the shared heading lockup used by support calls to action.
 *
 * @returns The heading and its description.
 */
export const SupportContentHeading = ({
  description,
  title,
}: SupportContentHeadingProps) => (
  <div className={styles.heading}>
    <h2 className={cn(typography.marketingSectionHeading, styles.title)}>
      {title}
    </h2>
    <p className={cn(typography.marketingBodyCompact, styles.description)}>
      {description}
    </p>
  </div>
);
