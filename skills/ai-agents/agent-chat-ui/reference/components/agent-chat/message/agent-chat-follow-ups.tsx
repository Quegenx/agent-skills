import { m } from "motion/react";

/**
 * Questions to ask next, under the last answer (follow-ups): a
 * column of outlined buttons that rise in from a blur one after another;
 * one press sends the question.
 *
 * @returns The follow-up buttons.
 */
export const AgentChatFollowUps = ({
  questions,
  onSelect,
}: {
  questions: readonly string[];
  onSelect: (question: string) => void;
}) => (
  <div className="agent-chat-follow-ups">
    {questions.map((question, index) => (
      <m.div
        key={question}
        initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.1 * index }}
      >
        <button
          type="button"
          className="agent-chat-button agent-chat-follow-up"
          data-variant="outline"
          onClick={() => {
            onSelect(question);
          }}
        >
          {question}
        </button>
      </m.div>
    ))}
  </div>
);
