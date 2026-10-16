/**
 * The agent's question to the user (askUserQuestion), as a card like the
 * approval card: the question as its title and, while it waits for an
 * answer, the answers as full-width rows to pick, numbered. Picking one
 * sends it as the user's next message; the user may also type their own.
 * Once answered, the card keeps the question and the reply shows below it as
 * the user's message. Before, the answers showed as the follow-up
 * suggestions under the answer, and the owner read them as an afterthought
 * (2026-10-16).
 *
 * @returns The question card.
 */
export const AgentChatQuestionCard = ({
  question,
  options,
  onSelect,
}: {
  question: string;
  // Null once the question is answered.
  options: readonly string[] | null;
  onSelect: (answer: string) => void;
}) => (
  // A plain block, not a named section: a section with a name would list
  // every question among the page's regions; the heading names it.
  <div className="agent-chat-card">
    <div className="agent-chat-card-body">
      <h3 className="agent-chat-card-title">
        <bdi>{question}</bdi>
      </h3>
    </div>
    {options && options.length > 0 && (
      <div className="agent-chat-question-options">
        {options.map((option, index) => (
          <button
            key={option}
            type="button"
            className="agent-chat-question-option"
            onClick={() => {
              onSelect(option);
            }}
          >
            <span className="agent-chat-question-option-index" aria-hidden>
              {index + 1}
            </span>
            <bdi>{option}</bdi>
          </button>
        ))}
      </div>
    )}
  </div>
);
