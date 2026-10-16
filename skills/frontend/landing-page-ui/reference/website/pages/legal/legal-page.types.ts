/**
 * One section of a legal document: its anchor id, title, paragraphs and points.
 */
export interface LegalDocumentSection {
  id: string;
  paragraphs: readonly string[];
  points?: readonly string[];
  title: string;
}

/**
 * A legal document: its title, when it was updated, its intro and its sections.
 */
export interface LegalDocument {
  intro: readonly string[];
  sections: readonly LegalDocumentSection[];
  title: string;
  updated: string;
}
