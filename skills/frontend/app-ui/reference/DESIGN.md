---
version: alpha
name: facebook.com signed-in components
source: https://www.facebook.com/
inspected: 2026-10-01
colors:
  background: "#f2f4f7"
  surface: "#ffffff"
  primary: "#0866ff"
  on-surface: "#080809"
  secondary-text: "#65686c"
  secondary-surface: "#e2e5e9"
  search-surface: "#f0f2f5"
  divider: "#d0d3d7"
  input-border: "#ced0d4"
  disabled-button-text: "#bcc0c4"
typography:
  fontFamily: '"Geist", "Ploni", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
  body: "15px / 20px, 400"
  button-medium: "15px / 20px, 600"
  button-large: "17px / 20px, 600"
  card-title: "17px / 20px, 600"
  metadata: "13px / 16px"
rounded:
  button: "8px"
  card: "12px"
  input: "12px"
  search: "50px"
  toolbar-button: "999px"
  menu-row-overlay: "4px"
---

# Reference and scope

Use the signed-in Facebook homepage as the component reference. These measurements replace the previous logged-out login-page theme. The two surfaces have different buttons, typography, and elevation; do not mix their tokens.

Inspect rendered styles and the matching Tailwind classes before extending this specification. Keep application content and behavior in Hebrew and RTL. The app remains a group-search tool, with its own routes, table, filters, and API.

# Measured component families

| Component | Source geometry and appearance |
| --- | --- |
| Standard action | 36px height, 8px radius, 12px horizontal padding, 15px/20px semibold label |
| Large action | 40px height, 8px radius, 17px/20px semibold label |
| Toolbar icon button | 40px square, circular corners, gray secondary surface |
| Content card | White surface, no border, 12px corners, `0 1px 2px rgba(0,0,0,.2)` shadow; padding belongs to inner sections |
| Search | Gray `#f0f2f5` label, 40px height, 50px corners, 15px input text; input padding `7px 8px 9px` |
| Compact menu search | 36px height, same pill shape, input horizontal padding 6px |
| Floating menu | White surface, 12px corners, no border, `0 12px 28px rgba(0,0,0,.2), 0 2px 4px rgba(0,0,0,.1)` shadow |
| Post action menu row | 8px padding, 15px/20px medium label, 36px height for a single line, 4px interaction-overlay corners |
| Checkbox | 24px control, 22px visible frame inset 1px, 1.5px stroke, 4px frame corners; circular overlay extends 8px outside the control |
| Numbered badge | 19px height/minimum width, 13px/13px medium text, 5px horizontal label padding; circles for one digit, pills for longer counts |

The post action menu measured 344px wide. Its arrow attachment removes one corner; our shared menus use the all-rounded surface observed in the profile menu because they have no arrow. Select popups retain the app's anchor-based sizing and share the menu's 8px inner inset without an additional group inset. Menu rows and disabled labels were also verified by rendering Facebook's loaded `FDSMenu.react` and `FDSMenuItem.react` components.

Facebook's outer wrappers often inherit 12px text while their visible label spans set 15px or 17px. Match the visible label, rather than copying wrapper typography. Cards resolve to 12px corners when inset; Facebook's source formula removes rounded corners when a card reaches the viewport edges. Our cards remain inset.

# States and motion

- Hover overlay: `rgba(0,0,0,.05)`.
- Pressed overlay: `rgba(0,0,0,.1)`.
- Overlay fade-out: 100ms, `cubic-bezier(0,0,1,1)`.
- Hover and press overlay activation: immediate.
- Disabled action: `#e2e5e9` surface and `#bcc0c4` label.
- Source icon transition: 200ms, `cubic-bezier(.08,.52,.52,1)`.

Use the existing Base UI primitives for application interaction and native button, link, selection, and keyboard semantics. Do not copy Facebook endpoints or private application state. Menu visibility follows Base UI state without template zoom or slide animations that were not observed in the source.

# Field tokens and application adaptations

The live page exposes `--input-background: #ffffff`, `--input-border-color: #ced0d4`, `--input-corner-radius: 12px`, `--text-input-padding-vertical: 12px`, and field typography of 1rem, weight 500, line-height 1.2941. At the user's request, standalone numeric inputs use the gray `#f0f2f5` filled surface with no border on rest, hover, or focus. They retain the source field radius and typography, with the app's existing 1rem horizontal padding. This is an application adaptation, not a clone of Facebook's bordered forms. Invalid fields retain their error border.

Select triggers use the measured secondary action surface. Application glyphs are Hugeicons' free stroke set (`@hugeicons/core-free-icons`), mapped by meaning in `AppIcon` (`src/components/ui/general/app-icon.tsx`) and drawn in the text color.

Checkbox measurements come from Facebook's loaded `FDSCheckbox.react` implementation and its rendered 24px variant. The box is drawn in CSS: outlined until checked, then filled in the primary color with Hugeicons' tick (or minus for a mixed selection) in white. Checked and disabled states retain the app's Base UI semantics. It shows no focus ring (D11 in `docs/system/decisions.md`).

Badge measurements come from `FDSNumberedBadge.react`, rendered with gray, blue, light-blue, and red colors and single/multiple digit counts. Gray counters use `#5c5e62`, blue counters `#0064d1`, and red counters `#dd2334`, with white labels. The source's light-blue variant uses `#e7f3ff` with `#0064d1` text. Our metadata badges share the measured typography and pill geometry; outlined, ghost, and link variants remain app-specific adaptations. Keep complete group totals: Facebook's notification overflow behavior (`20+`) is not applied to group-result counts.

The app shell and results table remain app-specific layouts. The table uses white rows, the gray `#f0f2f5` header surface, `#d0d3d7` separators, the measured 5% black hover overlay, and `#e7f3ff` selected rows. Its 52px header height and 16px inline cell padding are application dimensions; this is not a verified clone of a Facebook data table. Sorting glyphs use the extracted Facebook chevrons mapped to this application role.

No control shows a focus ring, outline or focus border, the browser default included: the person's standing decision (D11 in `docs/system/decisions.md`), which waives WCAG 2.4.7. Focus can still reveal hidden actions and float labels.

# Responsive implementation

Use rem for dimensions and typography; the table above records source pixels at a 16px root size. Keep fluid app spacing in `clamp(rem, rem + cqi, rem)` and use container queries for form layout. Do not apply fluid font scaling to measured control labels. Use intrinsic grids, logical properties, safe-area padding, and mobile viewport heights already provided by the app.

The app's layout is an adaptation, not a clone of Facebook's feed columns. Verify controls on both desktop and narrow containers, including open menus, long Hebrew labels, and horizontal table scrolling. Do not claim the whole interface is 1:1 until the remaining component families and their states have been compared.

# Workspace layout reference

The application shell adapts `amichai-all` admin/course structure: a rounded 24px inset content surface, a 12px outer inset, a branded sidebar with 44px navigation rows, and desktop collapse to an icon rail. The Facebook palette and component skins remain in use. The sidebar is 17rem expanded and collapses to a 4rem rail (`app-shell.tsx`); it lists the app's seven destinations. Mobile retains the existing Base UI drawer and the workspace uses the full available width.

Active sidebar labels use Facebook's `#0064d1` link blue on `#e7f3ff`; the measured WCAG text contrast is 4.99:1. The brighter primary blue remains the action-button fill.

# Locally hosted typography

Two fonts, both hosted with the project: Geist for Latin text (`/fonts/geist/geist-variable.woff2`, Vercel's variable font, weights 100–900, with its OFL license beside it) and Ploni for Hebrew (`/fonts/ploni/`, one file per weight). The app and the website share them: `--app-button-font` lists Geist, then Ploni, then system fonts (`src/styles/base/tokens.css`), so each script picks its own face. `font-display: swap` keeps text visible during loading.

# Group details drawer

The right-side group-details drawer uses the measured white surface, 12px corner token, floating shadow, secondary circular close control, 17px/20px section titles, 15px/20px body text, and 13px/16px metadata. The 36rem width, 20px title, 16px section insets, persistent action footer, and detail grid are application adaptations, not a measured Facebook drawer clone. The scrolling wrapper is LTR to place the scrollbar on the right; its content remains RTL. Mobile footer padding respects the safe area.

# Group profile images

Group avatars use Facebook search's `view_model.profile.profile_picture.uri` and the details header's `profile_picture_for_sticky_bar.uri`. The table displays 40px thumbnails and the drawer header displays 48px thumbnails, with the measured 8px corner token and cover cropping. These sizes adapt the source search's 60px image to the existing app layout. Missing or failed images use the local Facebook groups glyph. Existing result objects without photo data remain supported; a fresh search supplies the additional field. Profile images remain remote group content and are not copied into the static icon collection.

# Search enrichment

Search results render immediately, then the client loads each group's details sequentially using the existing details API. This supplies reported member totals, activity, profile images, history dates, and membership metadata without requiring a separate bulk-load action. The existing cancellation control stops after the active group. Search-only rounded counts retain the ≈ marker until an exact total is available; unavailable values remain —. All supported table columns are visible by default and can be hidden through the columns menu.

# Search switches

Near me and My groups use Facebook's inspected small `FDSSwitch.react`: 44×24px clipped track, 20px white thumb with 20px travel, gray `#8f9297` off track, blue `#1876f2` on track, `0 1px 2px rgba(0,0,0,.5)` thumb shadow, and 150ms `cubic-bezier(.17,.17,0,1)` transitions. The source's nested 52×28px paint surface is preserved inside the clip. Disabled track opacity is .4. RTL mirrors thumb travel. Base UI owns checked state and accessible switch/native-button semantics; there is no focus ring (D11), and reduced motion disables transitions.
