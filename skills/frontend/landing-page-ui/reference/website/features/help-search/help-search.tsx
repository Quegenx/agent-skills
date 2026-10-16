import type { ChangeEvent, KeyboardEvent, TouchEvent, WheelEvent } from "react";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import {
  help_guides_title,
  help_search_articles,
  help_search_dialog_label,
  help_search_empty,
  help_search_group,
  help_search_label,
  help_search_placeholder,
} from "#/paraglide/messages";

import type { CssCustomPropertyStyle } from "../../../lib/css-custom-property-style";
import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";
import { useHelpSearchClose } from "./help-search-close";
import { HelpSearchCloseButton } from "./help-search-close-button";
import { HelpSearchGroup } from "./help-search-group";
import { getHelpSearchResults } from "./help-search-results";
import type {
  SearchableHelpQuestion,
  SearchableHelpTopic,
} from "./help-search-results";
import { helpSearchStyles as styles } from "./help-search.styles";

interface HelpSearchProps {
  onClose: () => void;
  questions: SearchableHelpQuestion[];
  topics: SearchableHelpTopic[];
}

const handleBackdropTouchMove = (event: TouchEvent) => {
  event.preventDefault();
};

const handleBackdropWheel = (event: WheelEvent) => {
  event.preventDefault();
};

const subscribeToClient = () => () => {
  // Client availability is stable after hydration.
};

const getClientSnapshot = (): boolean => true;
const getServerSnapshot = (): boolean => false;

// The selected result's preview beside the list: its kind and category, its
// title linking to it, its description and its details.
const HelpSearchPreview = ({
  selectedItem,
}: {
  selectedItem: ReturnType<typeof getHelpSearchResults>["results"][number];
}) => (
  <div data-cmdk-preview="" className={styles.preview}>
    <div
      data-cmdk-preview-article-header=""
      className={cn(typography.label, styles.previewHeader)}
    >
      <p>
        {selectedItem.kind === "topic"
          ? help_guides_title()
          : help_search_articles()}
      </p>
      <span
        data-category={selectedItem.categorySlug}
        className={cn(typography.label, styles.previewTag)}
      >
        {selectedItem.category}
      </span>
    </div>
    <a
      data-cmdk-preview-title=""
      href={selectedItem.href}
      className={cn(typography.heading3, styles.previewTitle)}
    >
      {selectedItem.title}
    </a>
    <p
      data-cmdk-preview-article-description=""
      className={cn(typography.label, styles.previewDescription)}
    >
      {selectedItem.description}
    </p>
    {selectedItem.details?.length !== undefined &&
    selectedItem.details?.length !== 0 ? (
      <ul className={cn(typography.label, styles.previewDetails)}>
        {selectedItem.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    ) : null}
  </div>
);

/**
 * The help center's search dialog: questions and topics that match as the
 * person types, chosen with the keyboard or the pointer, with the selected
 * question's answer beside them.
 *
 * @param props - onClose: closes the dialog; questions and topics: what it
 *   searches.
 * @returns The dialog, once in the browser.
 */
export const HelpSearch = ({ onClose, questions, topics }: HelpSearchProps) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isClient = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot
  );

  const generatedId = useId();
  const inputId = `${generatedId}-input`;
  const labelId = `${generatedId}-label`;
  const listId = `${generatedId}-list`;
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const { questionResults, results, topicResults } = getHelpSearchResults(
    normalizedQuery,
    questions,
    topics
  );

  const selectedItem = results.at(selectedIndex) ?? results.at(0);

  const listStyle: CssCustomPropertyStyle = {
    "--cmdk-list-height": `${results.length * 44}px`,
  };

  const { isClosing, requestClose, handleTransitionEnd } = useHelpSearchClose(
    onClose,
    inputRef
  );

  const _handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setSelectedIndex(0);
  };

  const _handleOnKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      requestClose();
    } else if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setSelectedIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setSelectedIndex(
        (current) => (current - 1 + results.length) % results.length
      );
    } else if (event.key === "Enter") {
      const result = results.at(selectedIndex);

      if (result !== undefined) {
        window.location.assign(result.href);
      }
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <>
      {createPortal(
        <>
          <div
            aria-hidden="true"
            className={cn(styles.overlay, isClosing && styles.overlayClosed)}
            data-aria-hidden="true"
            data-cmdk-overlay=""
            data-state={isClosing ? "closed" : "open"}
            onPointerDown={requestClose}
            onTouchMove={handleBackdropTouchMove}
            onTransitionEnd={handleTransitionEnd}
            onWheel={handleBackdropWheel}
            style={{ pointerEvents: isClosing ? "none" : "auto" }}
          />
          <dialog
            aria-labelledby={labelId}
            aria-modal="true"
            data-cmdk-dialog=""
            data-lenis-prevent="true"
            open
            className={styles.dialogLayer}
          >
            <div
              data-cmdk-root=""
              tabIndex={-1}
              className={cn(styles.root, isClosing && styles.rootClosed)}
              style={{
                opacity: isClosing ? 0 : 1,
                transform: isClosing
                  ? "scale(0.9) translateY(1.25rem)"
                  : "scale(1)",
              }}
            >
              <HelpSearchCloseButton onClose={requestClose} />
              <label
                data-cmdk-label=""
                htmlFor={inputId}
                id={labelId}
                className={typography.visuallyHidden}
              >
                {help_search_dialog_label()}
              </label>
              <input
                aria-controls={listId}
                aria-label={help_search_label()}
                aria-labelledby={labelId}
                autoComplete="off"
                autoCorrect="off"
                data-cmdk-input=""
                id={inputId}
                onChange={_handleOnChange}
                onKeyDown={_handleOnKeyDown}
                placeholder={help_search_placeholder()}
                ref={inputRef}
                spellCheck="false"
                type="text"
                value={query}
                className={cn(typography.marketingBodyCompact, styles.input)}
              />
              <div data-cmdk-content="" className={styles.content}>
                {/* The results are links, each reachable with Tab; the arrow
                    keys in the input highlight one and Enter opens it. */}
                <section
                  aria-label={help_search_group()}
                  data-cmdk-list=""
                  id={listId}
                  tabIndex={-1}
                  className={cn(
                    styles.list,
                    results.length === 0 && styles.emptyList
                  )}
                  style={listStyle}
                >
                  <div data-cmdk-list-sizer="">
                    {results.length === 0 ? (
                      <div data-cmdk-empty="" className={styles.empty}>
                        <p
                          className={cn(
                            typography.marketingContentTitle,
                            styles.emptyText
                          )}
                        >
                          {help_search_empty()}
                        </p>
                      </div>
                    ) : (
                      <>
                        <HelpSearchGroup
                          heading={help_search_articles()}
                          indexOffset={0}
                          items={questionResults}
                          onSelect={setSelectedIndex}
                          selectedIndex={selectedIndex}
                        />
                        <HelpSearchGroup
                          heading={help_guides_title()}
                          indexOffset={questionResults.length}
                          items={topicResults}
                          onSelect={setSelectedIndex}
                          selectedIndex={selectedIndex}
                        />
                      </>
                    )}
                  </div>
                </section>
                {selectedItem ? (
                  <HelpSearchPreview selectedItem={selectedItem} />
                ) : null}
              </div>
            </div>
          </dialog>
        </>,
        document.body
      )}
    </>
  );
};
