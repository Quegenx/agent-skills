import { documentFoundation } from "../shared/styles/document-foundation";
import { cn } from "../shared/styles/site-class-merge";
import { typography } from "../shared/styles/typography";

// The website's <html> and <body> classes, which routes/__root.tsx applies on
// website pages only; the app's pages under /app keep plain ones.
export const siteDocumentProps = { className: documentFoundation.document };

export const siteBodyProps = {
  className: cn(typography.body, documentFoundation.body),
};
