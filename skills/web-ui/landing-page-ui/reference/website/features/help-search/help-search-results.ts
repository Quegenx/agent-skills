import { localizeHref } from "#/paraglide/runtime";

import type { HelpSearchResult } from "./help-search-group";

/**
 * A help question as the search reads it: its title, answer, bullets, topic and
 * link.
 */
export interface SearchableHelpQuestion {
  answer: string;
  bullets: string[];
  href: string;
  title: string;
  topicSlug: string;
}

/**
 * A help topic as the search reads it: its title, description and link.
 */
export interface SearchableHelpTopic {
  description: string;
  href: string;
  slug: string;
  title: string;
}

interface HelpSearchResults {
  questionResults: HelpSearchResult[];
  results: HelpSearchResult[];
  topicResults: HelpSearchResult[];
}

const matchesQuery = (query: string, title: string, description: string) =>
  !query || `${title} ${description}`.toLocaleLowerCase().includes(query);

/**
 * The help search's results for a query: questions whose title, answer or
 * bullets match, and topics whose title or description match; everything when
 * the query is empty.
 *
 * @param query - The search text.
 * @param questions - The help questions.
 * @param topics - The help topics.
 * @returns The question results, the topic results, and both in one list.
 */
export const getHelpSearchResults = (
  query: string,
  questions: SearchableHelpQuestion[],
  topics: SearchableHelpTopic[]
): HelpSearchResults => {
  const topicTitleBySlug = new Map(
    topics.map((topic) => [topic.slug, topic.title])
  );

  const questionResults: HelpSearchResult[] = [];

  for (const question of questions) {
    const searchableAnswer = [question.answer, ...question.bullets].join(" ");

    if (matchesQuery(query, question.title, searchableAnswer)) {
      questionResults.push({
        category:
          topicTitleBySlug.get(question.topicSlug) ?? question.topicSlug,
        categorySlug: question.topicSlug,
        description: question.answer,
        details: question.bullets,
        href: localizeHref(question.href),
        kind: "question",
        title: question.title,
      });
    }
  }

  const topicResults: HelpSearchResult[] = [];

  for (const topic of topics) {
    if (matchesQuery(query, topic.title, topic.description)) {
      topicResults.push({
        category: topic.title,
        categorySlug: topic.slug,
        description: topic.description,
        href: localizeHref(topic.href),
        kind: "topic",
        title: topic.title,
      });
    }
  }

  return {
    questionResults,
    results: [...questionResults, ...topicResults],
    topicResults,
  };
};
