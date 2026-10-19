import type { HelpQuestion } from "./help-center-model";
import { getHelpQuestionGroups } from "./help-question-data";

// The help center's question lists (help-question-data.ts holds the
// questions): all of them in topic order, the common ones, and a topic page's.

/**
 * Every help question, topic by topic, in the page's language.
 *
 * @returns The questions.
 */
export const getHelpQuestions = (): HelpQuestion[] => {
  const groups = getHelpQuestionGroups();

  return [
    ...groups.account,
    ...groups.facebookAccounts,
    ...groups.aiAgent,
    ...groups.tasks,
    ...groups.opportunities,
    ...groups.groups,
    ...groups.competitors,
    ...groups.dataPrivacy,
  ];
};

/**
 * The help questions people ask most, shown on the help page.
 *
 * @returns The common questions.
 */
export const getCommonHelpQuestions = (): HelpQuestion[] => {
  const commonIds = new Set([
    "connect-facebook",
    "agent-approval",
    "create-task",
    "opportunity-match",
  ]);

  return getHelpQuestions().filter((question) => commonIds.has(question.id));
};

const minimumTopicQuestionCount = 6;

/**
 * A topic page's questions: the topic's own, topped up with others to the
 * page's minimum.
 *
 * @param topicQuestions - The topic's questions.
 * @returns The page's questions.
 */
export const getHelpTopicPageQuestions = (
  topicQuestions: HelpQuestion[]
): HelpQuestion[] => {
  const pageQuestions = [...topicQuestions];
  const includedIds = new Set(topicQuestions.map((question) => question.id));

  for (const question of getHelpQuestions()) {
    if (pageQuestions.length >= minimumTopicQuestionCount) {
      break;
    }

    if (!includedIds.has(question.id)) {
      pageQuestions.push(question);
      includedIds.add(question.id);
    }
  }

  return pageQuestions;
};
