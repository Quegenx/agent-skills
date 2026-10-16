# Reference source

The production source this skill was written from. Copy these files as they are: they are the exact design, motion and behaviour the skill describes. Imports outside this folder (i18n messages, data atoms, server calls) are the app's own; replace them with yours.

Paths below are relative to this folder and keep the source's layout under `src/` (so `@/components/ui/general/button` is `components/ui/general/button.tsx` here). `DESIGN.md` and `scripts/` sat at the source repo's root. The brand name was replaced with `app` in names, classes, variables, data attributes and file names (`app-icon.tsx`, `AppIcon`, `data-slot="app-icon"`, `--app-button-height`); nothing else was changed.

## Files

| File | What it is | Described in |
|---|---|---|
| `DESIGN.md` | The measured design reference: component families, field tokens, fonts, states and motion | [TOKENS.md](../TOKENS.md) |
| `styles.css` | The app's global stylesheet: Tailwind, the theme mapping and the import order of every stylesheet | [TOKENS.md](../TOKENS.md) |
| **Base styles** | | |
| `styles/base/tokens.css` | Color tokens for light and dark, surfaces, ink at an opacity, shadows | [TOKENS.md](../TOKENS.md) |
| `styles/base/motion-tokens.css` | Duration and easing token scale | [TOKENS.md](../TOKENS.md) |
| `styles/base/fluid-scale.css` | Fluid spacing and display type, registered as lengths | [TOKENS.md](../TOKENS.md) |
| `styles/base/typography.css` | Type role classes (`type-*`) | [TOKENS.md](../TOKENS.md) |
| `styles/base/document.css` | Font faces, document defaults, no focus ring, thin scrollbars | [TOKENS.md](../TOKENS.md) |
| `styles/base/cursor.css` | Cursor for every interactive state in one place | [TOKENS.md](../TOKENS.md) |
| `styles/base/hit-area.css` | Minimum hit area, 40px and 44px on touch | [TOKENS.md](../TOKENS.md) |
| `styles/base/theme-transition.css` | The theme switch's circle reveal | [TOKENS.md](../TOKENS.md) |
| **General controls** | | |
| `components/ui/general/button.tsx` | The button and its variants and sizes | [CONTROLS.md](../CONTROLS.md) |
| `styles/ui/general/button.css` | Button surfaces, hover and press overlays, sizes, disabled | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/general/app-icon.tsx` | Every icon named by meaning, from Hugeicons; the morphing icon | [CONTROLS.md](../CONTROLS.md) |
| `styles/ui/general/icon.css` | Icon sizes, the morph icon, optical padding beside a label | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/general/icon-swap.tsx` | An icon that swaps with state, shrink and blur out, grow in | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/general/morph-text.tsx` | Text that morphs between labels without moving its box (torph) | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/general/number-flow-message.tsx` | A translated message whose numbers roll (NumberFlow) | [CONTROLS.md](../CONTROLS.md) |
| **Fields and forms** | | |
| `components/ui/forms/fields/field.tsx` | Field, label, description, error and the form grids | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/forms/fields/input.tsx` | Text input and textarea | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/forms/fields/label.tsx` | Label | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/forms/fields/number-input.tsx` | Whole-number field on Base UI NumberField with rolling digits | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/forms/fields/select-field.tsx` | A labelled dropdown of fixed choices | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/forms/fields/checkbox.tsx` | Checkbox that squishes on press | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/forms/fields/checkbox-mark.tsx` | The tick and dash drawn as a stroke | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/forms/fields/switch.tsx` | Switch with the stretching thumb | [CONTROLS.md](../CONTROLS.md) |
| `styles/ui/forms/form-controls.css` | Field variables, value type, menu geometry | [CONTROLS.md](../CONTROLS.md) |
| `styles/ui/forms/checkbox.css` | Checkbox box and states | [CONTROLS.md](../CONTROLS.md) |
| `styles/ui/forms/switch.css` | Switch track, surface and thumb | [CONTROLS.md](../CONTROLS.md) |
| `styles/ui/forms/search.css` | Search field and its clear button | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/forms/filters/search-input.tsx` | Search input whose clear button springs in and out | [CONTROLS.md](../CONTROLS.md) |
| `lib/interaction/number-input-text.ts` | A number input's value as text and back | [CONTROLS.md](../CONTROLS.md) |
| **Display** | | |
| `components/ui/display/badge.tsx` | Badge and tag | [CONTROLS.md](../CONTROLS.md) |
| `styles/ui/display/badge.css` | Badge and tag styles | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/display/tooltip.tsx` | Tooltip on Base UI | [CONTROLS.md](../CONTROLS.md) |
| `styles/ui/display/tooltip.css` | Tooltip pop and fade | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/navigation/tabs/segmented-tabs-list.tsx` | Segmented tabs with a sliding, stretching pill | [CONTROLS.md](../CONTROLS.md) |
| `styles/ui/navigation/segmented-tabs.css` | Segmented tabs track and pill | [CONTROLS.md](../CONTROLS.md) |
| `styles/ui/navigation/animated-link.css` | Underline that grows on link hover, mirrored in right to left | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/display/card.tsx` | Card surface | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/ui/display/table.tsx` | Table parts | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `styles/ui/display/table.css` | Table frame, header, rows and cells | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/ui/display/media-carousel.tsx` | Sideways snapping media with previous and next buttons | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `styles/ui/display/media-carousel.css` | Carousel layout, buttons and play button | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/ui/display/empty.tsx` | The empty state: icon tile, title, line and actions | [STATES.md](../STATES.md) |
| `components/ui/feedback/status/alert.tsx` | Inline alert in tinted fills | [STATES.md](../STATES.md) |
| `components/ui/feedback/status/shimmer-text.tsx` | Work in progress said in words with a sweeping band | [STATES.md](../STATES.md) |
| `styles/ui/feedback/shimmer-text.css` | The shimmer band and its reduced motion fallback | [STATES.md](../STATES.md) |
| **Layout primitives** | | |
| `components/ui/layout/direction.tsx` | Direction provider for right to left | [TOKENS.md](../TOKENS.md) |
| `components/ui/layout/separator.tsx` | Separator | [CONTROLS.md](../CONTROLS.md) |
| `components/ui/layout/step-slide-switcher.tsx` | Steps that slide out one side and in the other | [OVERLAYS.md](../OVERLAYS.md) |
| **Menus and dropdowns** | | |
| `components/ui/navigation/dropdown/smooth-dropdown.tsx` | The dropdown whose trigger surface springs open into the menu | [MENUS.md](../MENUS.md) |
| `components/ui/navigation/dropdown/smooth-dropdown-geometry.ts` | Where the surface sits, its size and spring | [MENUS.md](../MENUS.md) |
| `components/ui/navigation/dropdown/smooth-dropdown-trigger.tsx` | The closed face whose label fades as it opens | [MENUS.md](../MENUS.md) |
| `components/ui/navigation/dropdown/smooth-dropdown-rows.tsx` | Rows that fade in staggered, one springing highlight | [MENUS.md](../MENUS.md) |
| `components/ui/navigation/dropdown/smooth-dropdown-search.tsx` | Search field above long lists, typing goes to it | [MENUS.md](../MENUS.md) |
| `components/ui/navigation/dropdown/smooth-select.tsx` | One choice among items on the smooth dropdown | [MENUS.md](../MENUS.md) |
| `components/ui/navigation/dropdown/smooth-dropdown.module.css` | The morphing surface | [MENUS.md](../MENUS.md) |
| `components/ui/navigation/dropdown/smooth-dropdown-menu.module.css` | The menu rows, visible count and edge blur | [MENUS.md](../MENUS.md) |
| `components/ui/forms/date-range/date-range-picker.tsx` | Date range picker: common ranges beside two months | [MENUS.md](../MENUS.md) |
| `components/ui/forms/date-range/date-range-month.tsx` | One month with the range drawn as a band | [MENUS.md](../MENUS.md) |
| `components/ui/forms/date-range/date-range-chip.tsx` | A typed date chip | [MENUS.md](../MENUS.md) |
| `components/ui/forms/date-range/date-range-picker.module.css` | Date range picker styles | [MENUS.md](../MENUS.md) |
| `lib/dates/calendar-dates.ts` | Calendar days as ISO strings in local time | [MENUS.md](../MENUS.md) |
| `lib/dates/date-range-presets.ts` | Date chips, range length and common ranges | [MENUS.md](../MENUS.md) |
| `lib/dates/relative-time.ts` | How long ago, in the largest whole unit | [CONTROLS.md](../CONTROLS.md) |
| **Sidebar** | | |
| `components/ui/navigation/sidebar/sidebar.tsx` | Sidebar panel on desktop, sheet on mobile | [MENUS.md](../MENUS.md) |
| `components/ui/navigation/sidebar/sidebar-context.tsx` | Sidebar state, provider and keyboard shortcut | [MENUS.md](../MENUS.md) |
| `components/ui/navigation/sidebar/sidebar-layout.tsx` | Sidebar layout parts | [MENUS.md](../MENUS.md) |
| `components/ui/navigation/sidebar/sidebar-menu.tsx` | Sidebar menu rows | [MENUS.md](../MENUS.md) |
| `components/ui/navigation/sidebar/sidebar-toggle-icon.tsx` | Panel icon whose pane widens and narrows | [MENUS.md](../MENUS.md) |
| `components/layout/sidebar/app-sidebar.tsx` | The app's sidebar: sections, pages, counts, account | [MENUS.md](../MENUS.md) |
| `components/layout/sidebar/app-sidebar-nav.tsx` | One sidebar section and its pages | [MENUS.md](../MENUS.md) |
| `components/layout/sidebar/app-sidebar-account.tsx` | The signed-in user's row, settings, language and sign out | [MENUS.md](../MENUS.md) |
| `components/layout/sidebar/app-sidebar-hover-highlight.tsx` | The sliding hover highlight | [MENUS.md](../MENUS.md) |
| `styles/layout/sidebar/app-sidebar-collapsible.css` | A sidebar row that opens a menu beneath it | [MENUS.md](../MENUS.md) |
| `styles/layout/sidebar/app-sidebar-hover-highlight.css` | The hover highlight's styles | [MENUS.md](../MENUS.md) |
| **App shell** | | |
| `components/layout/shell/app-shell.tsx` | An app page: header and content | [MENUS.md](../MENUS.md) |
| `components/layout/shell/app-header.tsx` | The page header with title, actions and the bell | [MENUS.md](../MENUS.md) |
| `components/layout/shell/app-notifications.tsx` | The header's bell and its notification panel | [MENUS.md](../MENUS.md) |
| `components/layout/shell/app-locale-transition.tsx` | The language switch animation | [MENUS.md](../MENUS.md) |
| `components/layout/shell/app-not-found-page.tsx` | The app's 404 page | [MENUS.md](../MENUS.md) |
| `components/layout/shell/app-site-theme-sync.ts` | Applies the saved or device theme and follows changes | [TOKENS.md](../TOKENS.md) |
| `components/layout/shell/user-avatar.tsx` | A user's generated avatar from their id | [CONTROLS.md](../CONTROLS.md) |
| `styles/layout/shell/app-shell.css` | The workspace shell | [MENUS.md](../MENUS.md) |
| `styles/layout/shell/page-layout.css` | Cards, content padding, page grids | [MENUS.md](../MENUS.md) |
| `styles/layout/shell/app-notifications.css` | Bell, panel and sidebar counts | [MENUS.md](../MENUS.md) |
| `styles/layout/shell/app-page-transition.css` | The reveal between app pages | [MENUS.md](../MENUS.md) |
| `lib/interaction/app-page-transition.ts` | Which view transition a move between pages runs | [MENUS.md](../MENUS.md) |
| `hooks/use-mobile.ts` | The mobile breakpoint, in rem | [MENUS.md](../MENUS.md) |
| **Overlays** | | |
| `components/ui/feedback/dialog/alert-dialog.tsx` | Confirm dialog on Base UI Dialog | [OVERLAYS.md](../OVERLAYS.md) |
| `components/ui/feedback/dialog/app-dialog-header.tsx` | A dialog's title and close button | [OVERLAYS.md](../OVERLAYS.md) |
| `components/ui/feedback/dialog/dialog-morph.ts` | A dialog that grows out of the button that opened it (Blendy) | [OVERLAYS.md](../OVERLAYS.md) |
| `components/ui/feedback/dialog/flight-morph.ts` | A popup that flies from its source along a curve | [OVERLAYS.md](../OVERLAYS.md) |
| `components/ui/feedback/dialog/sheet.tsx` | Side sheet | [OVERLAYS.md](../OVERLAYS.md) |
| `components/ui/feedback/confirm/in-place-confirm-button.tsx` | A destructive action that asks on the button itself | [OVERLAYS.md](../OVERLAYS.md) |
| `components/ui/feedback/confirm/confirm-cancel-button.tsx` | The cancel that springs out of the confirm button | [OVERLAYS.md](../OVERLAYS.md) |
| `styles/ui/feedback/dialog.css` | Dialog card, header, footer, morph | [OVERLAYS.md](../OVERLAYS.md) |
| `styles/ui/feedback/backdrop.css` | The backdrop behind every overlay | [OVERLAYS.md](../OVERLAYS.md) |
| `styles/ui/display/disclosure-panel.css` | Disclosure panel that unrolls its height | [OVERLAYS.md](../OVERLAYS.md) |
| **Filters and data views** | | |
| `components/ui/forms/filters/filter-chip.tsx` | A toolbar filter chip that opens the dropdown | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/ui/forms/filters/active-filter-chips.tsx` | Chosen filters as clearable chips, then clear all | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/ui/forms/filters/filterable-search-form.tsx` | The search card with its filters panel and count | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `styles/ui/forms/filter-chip.css` | Filter chip and reset styles | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `hooks/use-row-sort-glide.ts` | FLIP glide for re-sorted rows | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `lib/interaction/copied-link.ts` | Copy a link and report copied for two seconds | [STATES.md](../STATES.md) |
| **Example data screen: tasks board and list** | | |
| `components/tasks/view/tracking-tasks-view.tsx` | The tasks page: toolbar, board or list, sheet, selection | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/tasks/view/tracking-task-toolbar.tsx` | Search, filters, columns, sort and view switch | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/tasks/view/tracking-task-board.tsx` | Board columns and cards | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/tasks/view/tracking-task-list.tsx` | List grouped by status, rows with checkboxes | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/tasks/view/tracking-task-dnd.tsx` | Drag and drop to reorder and change status (dnd-kit) | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/tasks/view/tracking-task-selection-bar.tsx` | Bulk actions for ticked rows | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/tasks/view/tracking-task-view-parts.tsx` | Parts shared by cards and rows | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/tasks/view/tracking-task-view-switch.tsx` | The board and list switch transition | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/tasks/editor/tracking-task-sheet.tsx` | The task's edit sheet | [OVERLAYS.md](../OVERLAYS.md) |
| `components/tasks/editor/tracking-task-create-dialog.tsx` | The new task dialog | [OVERLAYS.md](../OVERLAYS.md) |
| `components/tasks/editor/tracking-task-editors.tsx` | Which task is open and whether the create dialog is | [OVERLAYS.md](../OVERLAYS.md) |
| `components/tasks/editor/tracking-task-fields.tsx` | The sheet's field groups | [OVERLAYS.md](../OVERLAYS.md) |
| `components/tasks/editor/tracking-task-labels-field.tsx` | Labels that grow in and out while pills glide aside | [CONTROLS.md](../CONTROLS.md) |
| `components/tasks/editor/tracking-task-pickers.tsx` | Status and priority pickers on a card or row | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/tasks/editor/tracking-task-choices.tsx` | Statuses and priorities with their icons | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/tasks/editor/tracking-task-icons.tsx` | Status icons | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `components/tasks/editor/tracking-task-scan-runs.tsx` | A task's run history, repeats collapsed | [STATES.md](../STATES.md) |
| `components/tasks/editor/tracking-task-site-searches.tsx` | A task's site searches, removable | [OVERLAYS.md](../OVERLAYS.md) |
| `styles/tasks/tracking-tasks.css` | Status colors, pickers and toolbar | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `styles/tasks/tracking-task-board.css` | Board columns, cards and dragging | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `styles/tasks/tracking-task-list.css` | List groups and rows | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `styles/tasks/tracking-task-view-transition.css` | The board and list switch | [DATA-VIEWS.md](../DATA-VIEWS.md) |
| `styles/tasks/tracking-task-create-dialog.css` | Create dialog and labels field | [OVERLAYS.md](../OVERLAYS.md) |
| **Auth** | | |
| `components/auth/auth-layout.tsx` | The frame every auth page shares | [AUTH.md](../AUTH.md) |
| `components/auth/auth-form.tsx` | Auth fields, password field with show and hide, notices, submit | [AUTH.md](../AUTH.md) |
| `components/auth/login-step.tsx` | Log in content | [AUTH.md](../AUTH.md) |
| `components/auth/signup-step.tsx` | Sign up content | [AUTH.md](../AUTH.md) |
| `components/auth/forgot-password-step.tsx` | Reset link request and sent state | [AUTH.md](../AUTH.md) |
| `styles/auth/auth-page.css` | Auth page frame and reveal | [AUTH.md](../AUTH.md) |
| `styles/auth/auth-form.css` | Auth form controls | [AUTH.md](../AUTH.md) |
| **Routes** | | |
| `routes/__root.tsx` | Root route: document, stylesheets per section, head | [AUTH.md](../AUTH.md) |
| `routes/app/route.tsx` | `/app`: reads the signed-in user, the app's 404 | [AUTH.md](../AUTH.md) |
| `routes/app/_app.tsx` | Signed-in guard and the shell around every page | [AUTH.md](../AUTH.md) |
| `routes/app/_auth.tsx` | Auth layout that slides its steps by depth | [AUTH.md](../AUTH.md) |
| `routes/app/_auth/login.tsx` | Log in route | [AUTH.md](../AUTH.md) |
| `routes/app/_auth/signup.tsx` | Sign up route | [AUTH.md](../AUTH.md) |
| `routes/app/_auth/forgot-password.tsx` | Forgot password route | [AUTH.md](../AUTH.md) |
| `routes/app/update-password.tsx` | New password after a recovery link | [AUTH.md](../AUTH.md) |
| `routes/auth/callback.ts` | Email link callback that exchanges the code | [AUTH.md](../AUTH.md) |
| **Direction and language** | | |
| `lib/i18n/app-direction.ts` | Reading direction per language | [TOKENS.md](../TOKENS.md) |
| `lib/i18n/app-intl-locale.ts` | The app's locales and their Intl locale | [CONTROLS.md](../CONTROLS.md) |
| `lib/i18n/app-locale-switch-atom.ts` | The language being switched to | [MENUS.md](../MENUS.md) |
| `lib/i18n/typed-text-direction.ts` | The dir of a box the user types into | [CONTROLS.md](../CONTROLS.md) |
| **Checker** | | |
| `scripts/design-system/check-system.mjs` | The design system checker | [CHECKS.md](../CHECKS.md) |
| `scripts/design-system/check-system.config.json` | Its config: token sources, UI folder, rules | [CHECKS.md](../CHECKS.md) |
| `scripts/design-system/check-allowlist.json` | Its allowlist of accepted findings | [CHECKS.md](../CHECKS.md) |

## What the files rely on

Packages, with the versions the source used:

| Package | Version |
|---|---|
| `react`, `react-dom` | ^19.3.1 |
| `motion` | ^14.3.0 |
| `@base-ui/react` | ^1.9.0 |
| `radix-ui` | ^1.8.1 |
| `react-aria-components` | ^1.22.1 |
| `@tanstack/react-router` | ^1.170.44 |
| `effect`, `@effect/atom-react` | 4.0.5 |
| `@dnd-kit/core` | ^6.3.1 |
| `@dnd-kit/sortable` | ^10.0.0 |
| `@dnd-kit/utilities` | ^3.2.2 |
| `@floating-ui/dom` | 1.8.0 |
| `@hugeicons/core-free-icons` | ^4.3.5 |
| `@hugeicons/react` | ^1.1.10 |
| `@internationalized/date` | ^3.12.4 |
| `@multiavatar/multiavatar` | 1.0.7 |
| `@number-flow/react` | ^0.6.2 |
| `blendy` | 0.0.1 |
| `morphicons` | 2.0.0 |
| `torph` | ^0.1.3 |
| `class-variance-authority` | ^0.7.1 |
| `cn` | ^0.4.0 |
| `tailwindcss` | ^4.3.3 |
| `tw-animate-css` | ^1.4.0 |
| `shadcn` (its `tailwind.css`) | ^4.21.5 |
| `streamdown` (its `styles.css`, imported by `styles.css`) | 2.7.0 |
| `@inlang/paraglide-js` (generates `#/paraglide/messages` and `#/paraglide/runtime`) | ^2.29.0 |

App modules the files import that are not copied (replace them with yours):

- Messages and locale: `#/paraglide/messages`, `#/paraglide/runtime`.
- Auth and session: `@/lib/auth/auth-session`, `@/lib/auth/auth-error-message`, `@/lib/auth/auth-form-submit`, `@/lib/auth/auth-redirect`, `@/lib/auth/session-server-calls`, `@/lib/auth/session-user-atom`, `@/server/runtime/app-runtime.server`, `@/server/runtime/supabase-client`.
- Data atoms: `@/lib/atoms/app-atom-runtime`, `@/lib/atoms/server-read-atom`, `@/lib/user-state/user-page-state-atom`, `@/lib/notifications/user-notification-atoms`, `@/lib/plans/user-plan-atoms`, `@/lib/settings/user-settings/user-settings-atoms`, `@/lib/settings/user-settings/user-settings-server-calls`, `@/lib/settings/user-settings/settings-dialog-section`, `@/lib/agent-memory/agent-memory-atoms`, `@/lib/facebook-accounts/facebook-account-atoms`, `@/lib/groups/finder/group-finder-provider`, `@/lib/groups/saved/saved-group-atoms`, `@/lib/perf/journey-timing-report`.
- Tasks data: `@/lib/tasks/tracking-task-atoms`, `@/lib/tasks/tracking-task-labels`, `@/lib/tasks/tracking-task-scan-run-atoms`, `@/lib/tasks/tracking-task-schema`, `@/lib/tasks/tracking-task-view`, `@/lib/sites/listing-price-format`, `@/lib/sites/listing-site-labels`.
- Other screens: `@/components/agent-chat/page/agent-chat-search-dialog`, `@/components/agent-chat/work/agent-chat-answer-work`, `@/components/layout/sidebar/app-sidebar-agent-chats` (the sidebar's chat list, part of the `agent-chat-ui` skill), `@/components/groups/saved/saved-group-picker`, `@/components/settings/page/settings-dialog`.
- Stylesheets `styles.css` imports that are not copied: `styles/groups/*`, `styles/posts/*`, `styles/ads/*`, `styles/agent-chat/*`, `styles/opportunities/*`, `styles/settings/*` and `styles/layout/sidebar/app-sidebar-agent-chats.css`. Drop those imports or point them at your own screens.
- Public files: fonts under `/fonts/ploni/` and `/fonts/geist/`, the logo `/brand/app-logo.webp` and the favicons under `/brand/`.
