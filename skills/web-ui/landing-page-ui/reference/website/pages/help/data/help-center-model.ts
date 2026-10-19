import type { IconSvgElement } from "@hugeicons/react";

/**
 * A help question: its title, answer and bullets, its topic, and its link on
 * the topic page.
 */
export interface HelpQuestion {
  answer: string;
  bullets: string[];
  href: string;
  id: string;
  title: string;
  topicSlug: string;
}

/**
 * A help topic: its title, descriptions, icon, link, and its questions.
 */
export interface HelpTopic {
  description: string;
  href: string;
  icon: IconSvgElement;
  metaDescription: string;
  questions: HelpQuestion[];
  slug: string;
  title: string;
}

/**
 * A question on its topic page, linked by its id.
 *
 * @param topicSlug - The topic the question belongs to.
 * @param id - The question's anchor id on its topic page.
 * @param title - The question.
 * @param answer - Its answer.
 * @param bullets - The answer's steps or points, if any.
 * @returns The question, linked to its place on its topic page.
 */
export const createHelpQuestion = (
  topicSlug: string,
  id: string,
  title: string,
  answer: string,
  bullets: string[] = []
): HelpQuestion => ({
  answer,
  bullets,
  href: `/help/${topicSlug}#${id}`,
  id,
  title,
  topicSlug,
});
