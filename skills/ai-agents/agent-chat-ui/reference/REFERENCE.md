# Reference source

The production source this skill was written from. Copy these files as they are: they are the exact design, motion and behaviour the skill describes. Imports outside this folder (i18n messages, data atoms, server calls) are the app's own; replace them with yours.

Paths below are relative to this folder and match the app's `src/` tree, so the `@/` imports between copied files resolve when the folder is placed as `src/`.

## Files

| File | What it is | Described in |
|---|---|---|
| `routes/app/_app/agent.tsx` | The chat page route: header title and tasks button, stored chats read before the page shows | [SKILL.md](../SKILL.md) |
| `components/agent-chat/page/agent-chat-page.tsx` | The agent page: greeting on a new chat, the conversation, the composer, the queue | [SKILL.md](../SKILL.md) |
| `components/agent-chat/page/agent-chat-conversation.tsx` | The conversation scroller, stick to bottom, space under the latest exchange | [STREAMING.md](../STREAMING.md) |
| `components/agent-chat/page/agent-chat-empty-state.tsx` | The new-chat screen: greeting and suggestions | [COMPOSER.md](../COMPOSER.md) |
| `components/agent-chat/page/agent-chat-placeholder.tsx` | The cycling placeholder over the empty text box | [COMPOSER.md](../COMPOSER.md) |
| `components/agent-chat/page/agent-chat-title.tsx` | The editable chat title in the page header | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `components/agent-chat/page/agent-chat-conversation-menu.tsx` | The chat menu from the title or its sidebar row | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `components/agent-chat/page/agent-chat-search-dialog.tsx` | The chat search dialog (Cmd/Ctrl+K) | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `components/agent-chat/page/agent-tasks-panel.tsx` | The tasks side panel and its trigger (Cmd/Ctrl+J) | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `components/agent-chat/page/agent-chat-transport.ts` | The chat transport; which finished tools make the page reload live data | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `components/agent-chat/page/agent-chat-first-reply-timing.ts` | Timing from send to the first words or tool | [WORK.md](../WORK.md) |
| `components/agent-chat/work/agent-chat-work-log.tsx` | The live status line and the folded work log | [WORK.md](../WORK.md) |
| `components/agent-chat/work/agent-chat-tool.tsx` | The header of a tool with its own card | [WORK.md](../WORK.md) |
| `components/agent-chat/work/agent-chat-tool-text.ts` | Every tool's title and icon, typed against the tool list | [WORK.md](../WORK.md) |
| `components/agent-chat/work/agent-chat-answer-work.ts` | The services and sources a tool call used | [WORK.md](../WORK.md) |
| `components/agent-chat/work/agent-chat-plan.tsx` | The agent's plan as a checklist | [WORK.md](../WORK.md) |
| `components/agent-chat/work/agent-chat-approval-card.tsx` | The approval card: confirm, revise, deny | [WORK.md](../WORK.md) |
| `components/agent-chat/work/agent-chat-approval-text.ts` | The approval card's question and summary, built from the call's input | [WORK.md](../WORK.md) |
| `components/agent-chat/cards/agent-chat-question-card.tsx` | The agent's question with numbered options | [WORK.md](../WORK.md) |
| `components/agent-chat/cards/agent-chat-ad-cards.tsx` | Ads a tool found, as result cards | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `components/agent-chat/cards/agent-chat-group-posts.tsx` | Group posts a tool listed, as a collapsible tool card | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `components/agent-chat/cards/agent-chat-group-search.tsx` | One group in search results, as the groups pages show it | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `components/agent-chat/cards/agent-chat-marketplace-listings.tsx` | Marketplace listings a search found | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `components/agent-chat/cards/agent-chat-opportunity-cards.tsx` | Opportunities an answer talked about, as the opportunities page shows them | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `components/agent-chat/cards/agent-chat-site-results.tsx` | A site tool call's result rows | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `components/agent-chat/cards/agent-chat-suggested-tasks.tsx` | Tracking tasks the agent suggests, one card each | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `components/agent-chat/cards/agent-chat-task-cards.tsx` | Tasks an answer worked on, as the live task board cards | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `components/agent-chat/message/agent-chat-message.tsx` | One message and its actions | [STREAMING.md](../STREAMING.md) |
| `components/agent-chat/message/agent-chat-answer-part.tsx` | One part of the answer: text, tool rows, result cards | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `components/agent-chat/message/agent-chat-smooth-text.ts` | The paced text buffer for the stream | [STREAMING.md](../STREAMING.md) |
| `components/agent-chat/message/agent-chat-markdown.tsx` | Safe markdown, source chips, hardened links and images | [STREAMING.md](../STREAMING.md) |
| `components/agent-chat/message/agent-chat-link-preview.tsx` | The link preview on hover | [STREAMING.md](../STREAMING.md) |
| `components/agent-chat/message/agent-chat-link-details.ts` | What a link's preview shows for something the agent found | [STREAMING.md](../STREAMING.md) |
| `components/agent-chat/message/agent-chat-image-viewer.tsx` | The image viewer on a blurred backdrop | [STREAMING.md](../STREAMING.md) |
| `components/agent-chat/message/agent-chat-message-files.tsx` | A message's attached files and image thumbnails | [COMPOSER.md](../COMPOSER.md) |
| `components/agent-chat/message/agent-chat-follow-ups.tsx` | Follow-up questions under the last answer | [WORK.md](../WORK.md) |
| `components/agent-chat/composer/agent-chat-composer.tsx` | The composer: text box, attachments, dictation, queue | [COMPOSER.md](../COMPOSER.md) |
| `components/agent-chat/composer/agent-chat-attachment-chip.tsx` | The inline attachment chip | [COMPOSER.md](../COMPOSER.md) |
| `components/agent-chat/composer/agent-chat-file-drop.ts` | Dropping files anywhere on the composer | [COMPOSER.md](../COMPOSER.md) |
| `components/agent-chat/composer/agent-chat-recording-strip.tsx` | The recording strip with the live waveform | [COMPOSER.md](../COMPOSER.md) |
| `components/layout/sidebar/app-sidebar-agent-chats.tsx` | The sidebar's conversation list, new chat and row menu | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `lib/agent-chat/attachments/agent-chat-attachments.ts` | An attached file and its upload | [COMPOSER.md](../COMPOSER.md) |
| `lib/agent-chat/attachments/agent-chat-file-types.ts` | Which file types the agent reads as documents | [COMPOSER.md](../COMPOSER.md) |
| `lib/agent-chat/conversation/agent-chat-queue.ts` | The queue of messages sent while the agent works | [COMPOSER.md](../COMPOSER.md) |
| `lib/agent-chat/conversation/agent-chat-conversation-actions.ts` | New, open, rename and delete conversation actions | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `lib/agent-chat/conversation/agent-chat-conversation-atoms.ts` | The stored conversations as atoms | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `lib/agent-chat/conversation/agent-chat-conversation-markdown.ts` | The conversation as markdown, for download | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `lib/agent-chat/conversation/agent-chat-messages.ts` | What a message carries beside its parts | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `lib/agent-chat/conversation/agent-chat-persistence.ts` | Stored conversations with their messages (server functions) | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `lib/agent-chat/conversation/agent-chat-server-calls.ts` | The conversation server functions as calls | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `lib/agent-chat/dictation/agent-chat-dictation.ts` | Dictation in the composer | [COMPOSER.md](../COMPOSER.md) |
| `lib/agent-chat/dictation/agent-chat-dictation-key.ts` | A signed-in user's key for one dictation (server function) | [COMPOSER.md](../COMPOSER.md) |
| `lib/agent-chat/dictation/agent-chat-soniox-stream.ts` | One dictation streamed to Soniox | [COMPOSER.md](../COMPOSER.md) |
| `lib/agent-chat/page/agent-chat-search-atoms.ts` | Whether the chat search is open | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `lib/agent-chat/page/agent-tasks-panel-atoms.ts` | Whether the tasks panel is open | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `styles/agent-chat/page/agent-chat.css` | The chat page, its tokens and buttons | [SKILL.md](../SKILL.md), [MOTION.md](../MOTION.md) |
| `styles/agent-chat/page/agent-chat-empty.css` | The new-chat screen | [COMPOSER.md](../COMPOSER.md) |
| `styles/agent-chat/page/agent-chat-conversation-menu.css` | The header title, chat menu and chat search | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `styles/agent-chat/page/agent-tasks-panel.css` | The tasks panel | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `styles/agent-chat/work/agent-chat-tool-rows.css` | Tool rows and the approval card | [WORK.md](../WORK.md) |
| `styles/agent-chat/work/agent-chat-tools.css` | Tool calls and their result cards in a message | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `styles/agent-chat/message/agent-chat-messages.css` | The conversation and messages | [STREAMING.md](../STREAMING.md) |
| `styles/agent-chat/message/agent-chat-markdown.css` | The agent's markdown | [STREAMING.md](../STREAMING.md) |
| `styles/agent-chat/message/agent-chat-image-viewer.css` | The image viewer | [STREAMING.md](../STREAMING.md) |
| `styles/agent-chat/composer/agent-chat-composer.css` | The composer | [COMPOSER.md](../COMPOSER.md) |
| `styles/agent-chat/composer/agent-chat-attachment-chip.css` | The attachment chips | [COMPOSER.md](../COMPOSER.md) |
| `styles/layout/sidebar/app-sidebar-agent-chats.css` | The sidebar's chats | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md) |
| `components/ui/feedback/status/shimmer-text.tsx` | Work in progress said in words, with a shimmer band | [WORK.md](../WORK.md), [MOTION.md](../MOTION.md) |
| `styles/ui/feedback/shimmer-text.css` | The shimmer band | [MOTION.md](../MOTION.md) |
| `components/ui/general/morph-text.tsx` | Text that morphs in place (the status line's steps) | [WORK.md](../WORK.md), [MOTION.md](../MOTION.md) |
| `components/ui/general/icon-swap.tsx` | An icon that changes with state (copy to copied) | [MOTION.md](../MOTION.md) |
| `components/ui/general/number-flow-message.tsx` | A localized message whose numbers flow when they change | [WORK.md](../WORK.md), [MOTION.md](../MOTION.md) |
| `components/ui/feedback/dialog/dialog-morph.ts` | The dialog that grows from the button that opened it | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md), the `app-ui` skill |
| `components/ui/navigation/dropdown/smooth-dropdown.tsx` | The morphing dropdown of options or actions | [RESULTS-AND-CONVERSATIONS.md](../RESULTS-AND-CONVERSATIONS.md), the `app-ui` skill |
| `components/ui/navigation/dropdown/smooth-dropdown-trigger.tsx` | The closed dropdown's face | the `app-ui` skill |
| `components/ui/navigation/dropdown/smooth-dropdown-rows.tsx` | The dropdown's option rows | the `app-ui` skill |
| `components/ui/navigation/dropdown/smooth-dropdown-search.tsx` | A long list's search field and "no results" | the `app-ui` skill |
| `components/ui/navigation/dropdown/smooth-dropdown-geometry.ts` | The trigger's and open menu's corners and sizes | the `app-ui` skill |
| `components/ui/navigation/dropdown/smooth-select.tsx` | A dropdown of one choice among items | the `app-ui` skill |
| `components/ui/navigation/dropdown/smooth-dropdown.module.css` | The closed trigger and the morph | the `app-ui` skill |
| `components/ui/navigation/dropdown/smooth-dropdown-menu.module.css` | The open menu and its rows | the `app-ui` skill |

## External imports

Packages (versions from the source `package.json`): `react` ^19.3.1, `react-dom` ^19.3.1, `ai` 7.0.142, `@ai-sdk/react` 4.0.146, `streamdown` 2.7.0, `@streamdown/code` ^2.0.0, `use-stick-to-bottom` ^1.1.6, `motion` ^14.3.0, `@number-flow/react` ^0.6.2, `torph` ^0.1.3, `blendy` 0.0.1, `@base-ui/react` ^1.9.0, `radix-ui` ^1.8.1, `@floating-ui/dom` 1.8.0, `effect` 4.0.5, `@effect/atom-react` 4.0.5, `@tanstack/react-router` ^1.170.44, `@tanstack/react-start` ^1.169.2, `cn` ^0.4.0.

App modules not copied here (replace with yours):

- i18n: `#/paraglide/messages`, `#/paraglide/runtime`, `@/lib/i18n/typed-text-direction`.
- UI primitives (in the `app-ui` skill's reference): `@/components/ui/general/app-icon`, `@/components/ui/general/button`, `@/components/ui/display/empty`, `@/components/ui/display/tooltip`, `@/components/ui/feedback/dialog/alert-dialog`, `@/components/ui/forms/fields/checkbox-mark`, `@/components/ui/forms/fields/field`, `@/components/ui/forms/fields/input`, `@/components/ui/forms/filters/search-input`, `@/components/ui/navigation/sidebar/sidebar-context`, `@/components/ui/navigation/sidebar/sidebar-menu`, `@/hooks/use-mobile`, `@/lib/dates/relative-time`. Also `@/lib/split-text-graphemes` (not in either reference).
- Data atoms and server calls: `@/lib/atoms/app-atom-runtime`, `@/lib/atoms/server-function-call`, `@/lib/atoms/server-read-atom`, `@/lib/auth/user-id-server-input`, `@/lib/settings/user-settings/user-settings-atoms`, `@/lib/plans/user-plan`, `@/lib/plans/user-plan-atoms`, `@/lib/perf/journey-timing-report`, `@/server/runtime/app-runtime.server`, `@/server/user-data/user-page-state.server`, `@/server/integrations/soniox.server`, `@/server/posts/group-post-search.server`, `@/server/sites/site-search-pages.server`.
- The agent's server side (see the `agent-harness` skill): `@/agent/chat/conversations/agent-chat-conversations.server`, `@/agent/chat/conversations/agent-chat-title.server`, `@/agent/chat/turn/agent-chat-errors`, `@/agent/core/tool-runtime/app-agent-tools`, `@/agent/skills/registry/agent-skills`, `@/agent/tools/conversation/agent-plan-tool`, `agent/tools/ad-library/ad-library-tool-support`.
- The product's own components and data, shown as result cards: `@/components/tasks/*`, `@/lib/tasks/*`, `@/components/opportunities/task-opportunity-item`, `@/lib/opportunities/*`, `@/components/groups/shared/*`, `@/lib/groups/*`, `@/components/ads/filters/*`, `@/lib/ads/catalog/*`, `@/lib/sites/*`.
- Backend contracts outside `src/` (relative imports): `backend/shared/text/non-empty-text`, `backend/shared/text/trim-text-end`, `backend/shared/schema/standard-schema`, `backend/shared/schema/iso-date-time`, `backend/jobs/job-search-contract`, `backend/listings/real-estate/real-estate-contract`, `backend/listings/yad2/yad2-classifieds-contract`, `backend/marketplace/marketplace-contract`.
