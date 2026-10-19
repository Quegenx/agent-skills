# Email templates

Email templates in the PostHog workflows library feed broadcast campaigns and `function_email` workflow steps. You author the template's design JSON with Liquid personalization, save it over MCP, and round-trip edit it. How a step references a template is in [WORKFLOWS.md](WORKFLOWS.md#function_email).

**Contents:** [Authoring](#authoring) · [Create](#create) · [Edit](#edit) · [Images](#images) · [Unlayer design JSON](#unlayer-design-json) · [Design guidelines](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/react-email/STYLING.md#email-design-alternatives) · [Prove it](#prove-it)

## Authoring

- **Author design JSON** (`content.email.design`) and save it with `workflows-create-email-template`. The server renders it with the same renderer as the visual editor (the Unlayer export API). The template then opens as editable blocks for humans and sends exactly what the design describes. Don't supply rendered output yourself; that's the visual editor's save path. Call it the template's "design" to users (the format is an internal detail), and always share the `_posthogUrl` edit link after creating or updating.
- **For one fragment the block editor can't express,** use an `html`-type content block inside the design. Humans can only edit it as a markup blob.
- **Liquid templating:** `Hi {{ person.properties.first_name | default: 'there' }},`. Liquid tags pass through the renderer as plain text, so use them anywhere: block text, subject, links.
- **Marketing emails must include an unsubscribe link:** `<a href="{{ unsubscribe_url }}">Unsubscribe</a>`; `{{ unsubscribe_url_one_click }}` is also available for one-click list-unsubscribe flows.
- **Click tracking rewrites every link,** which breaks mobile universal links and app deeplinks (they only resolve when the href stays on their own domain). Opt out on the `<a>` itself (in an html block) with `clicktracking="off"` or `data-ph-no-track`: `<a href="https://app.example.com/deeplink" data-ph-no-track>Open in app</a>`. The marker must be on the `<a>` itself, not a child element. That link then has no click metrics.

## Create

```json
{
  "name": "Welcome email",
  "description": "Sent to new signups on day 0",
  "type": "email",
  "content": {
    "templating": "liquid",
    "email": {
      "subject": "Welcome to {{ person.properties.company | default: 'our product' }}",
      "design": { "counters": { "u_row": 1 }, "schemaVersion": 16, "body": { "rows": ["…"] } },
      "text": "Plain-text fallback of the same message"
    }
  }
}
```

- **`subject` is required.** Author `design` and omit `html` (hand-written html without a design becomes one raw block in the editor). Always write a real plain-text `text`: clients that block rich content show only `text`, so filler like "placeholder" reaches real inboxes, and a text part that doesn't match the html hurts deliverability.
- **The tool result returns an edit link** into the PostHog library.
- **Pass the design directly in the tool call:** no scratch files, no pre-validation subprocesses, no payload preview rounds. Liquid tags (`{{ }}`, `{% %}`), apostrophes, single quotes and emoji are ordinary JSON characters; only standard JSON escaping applies. Never rewrite content to avoid them; converting Liquid's single quotes to double quotes inside markup attributes breaks the markup. If the call is rejected as malformed, fix the escaping and resend the same content unchanged.
- **After create or update,** call `workflows-show-email-template`; it renders an inline preview. Call it too when the user asks to see a template.

## Edit

- **`content` is replaced whole, never merged,** and humans may have edited the design in the visual editor since you last saw it: `workflows-get-email-template` (always fresh; its `design` is the source of truth), modify the `design` (keep subject and text alongside), `workflows-update-email-template` with the complete `content`, then `workflows-show-email-template`, whose response carries the final rendered html; read it before describing the result.
- **For small changes** prefer `workflows-patch-email-template` (id-addressed Unlayer block ops, applied atomically), so you send only the edit instead of the whole design.
- **A workflow step's email** lives in `config.inputs.email.value` (subject, text, html, design), independent of any library template; `workflows-get` shows its design and block ids. Edit it with `workflows-patch-action-email` (`action_id`, ops and/or `email_patch` for subject, preheader, text, recipients). The HTML is re-rendered server-side from the patched design. On an active workflow this stages a draft: `workflows-test-run` with `use_draft=true`, then `workflows-publish`.
- **`workflows-list-email-templates` returns metadata only;** fetch one for its content. A template can also start a broadcast in the PostHog UI. Soft-delete with `deleted: true` on `workflows-update-email-template`.

## Images

- **Look first:** `media-images-list` with `purpose="email"`; reuse an existing image (a logo, a header banner) instead of uploading a duplicate.
- **Upload:** `media-image-upload-start` (name, `purpose="email"`) returns `id`, `upload_url`, `form_fields`; then `curl -X POST <upload_url> -F key=value... -F file=@/path/to/image.png` (`file` last); then `media-image-upload-complete` with the `id` returns a permanent `url` for `values.src.url`. The media tools don't return dimensions, so set `values.src.width`/`height` by measuring the local file yourself rather than guessing.
- **Never base64 an image into a tool call;** a flipped token corrupts the image. Limits: under 4MB, and it must decode as PNG, JPEG, GIF, WebP, AVIF or BMP.

## Unlayer design JSON

- **IDs are arbitrary unique strings** (e.g. `"_BZCs8S2YW"`).
- **Top level:** `counters` (the highest `_meta.htmlID` suffix per type: `u_row`, `u_column`, `u_content_text`, `u_content_button`...), `schemaVersion: 16`, `body {id, rows, headers: [], footers: [], values}` (headers and footers usually `[]`). Keep `counters` consistent with the `_meta.htmlID`s you emit so the editor can number new elements.
- **Body values:** `backgroundColor`, `contentWidth: '600px'`, `fontFamily {label, value}`, `textColor`, `linkStyle {inherit, linkColor, linkHoverColor, linkUnderline, linkHoverUnderline}`.
- **Row:** `cells` ratios (`[1,1]` is 50/50, `[1,2]` is 33/66), `columns`, `values` (displayCondition, columns (`false` = locked columns), backgroundColor, columnsBackgroundColor, backgroundImage `{url, fullWidth, repeat, center, cover}`, padding (`"0px"` or `"10px 20px 10px 20px"`), `_meta {htmlID, htmlClassNames}`).
- **Column:** `id`, `contents`, `values {_meta, border, padding, backgroundColor}`.
- **Content item shared values:** containerPadding, anchor, textAlign, lineHeight (`'140%'`), linkStyle, hideDesktop, displayCondition, `_meta`, selectable, draggable, duplicatable, deletable, hideable.
- **Tool-specific values:** text and heading `{text}` (an HTML fragment); image `{src: {url, width, height}, alt, action}`; button `{text, href, buttonColors, size, borderRadius, ...}`; html `{html}`.
- **Content types:** `text`, `heading`, `button`, `image`, `divider`, `social`, `html`, `video`, `menu`, `timer`, `table`, `carousel`.
- **Validation constants:** display modes `'email'|'web'|'popup'|'document'`; text direction `'ltr'|'rtl'|null`; alignments `left|center|right|justify`; padding always in px (`'10px'`, `'10px 20px'`, `'10px 20px 30px 40px'`).

Minimal working example (one row, one column, one `text` block; adapted from [unlayer/unlayer-skills](https://github.com/unlayer/unlayer-skills), MIT License, Copyright (c) Unlayer):

```json
{
  "counters": { "u_row": 1, "u_column": 1, "u_content_text": 1 },
  "schemaVersion": 16,
  "body": {
    "id": "_BZCs8S2YW",
    "rows": [
      {
        "id": "LB2ltnM2OZ",
        "cells": [1],
        "columns": [
          {
            "id": "HI7oaTElxq",
            "contents": [
              {
                "id": "PKtuJs3uBF",
                "type": "text",
                "values": {
                  "containerPadding": "10px",
                  "anchor": "",
                  "textAlign": "left",
                  "lineHeight": "140%",
                  "linkStyle": {
                    "inherit": true,
                    "linkColor": "#0000ee",
                    "linkHoverColor": "#0000ee",
                    "linkUnderline": true,
                    "linkHoverUnderline": true
                  },
                  "hideDesktop": false,
                  "displayCondition": null,
                  "_meta": { "htmlID": "u_content_text_1", "htmlClassNames": "u_content_text" },
                  "selectable": true,
                  "draggable": true,
                  "duplicatable": true,
                  "deletable": true,
                  "hideable": true,
                  "text": "<p>Hello World</p>"
                }
              }
            ],
            "values": {
              "_meta": { "htmlID": "u_column_1", "htmlClassNames": "u_column" },
              "border": {},
              "padding": "0px",
              "backgroundColor": ""
            }
          }
        ],
        "values": {
          "displayCondition": null,
          "columns": false,
          "backgroundColor": "",
          "columnsBackgroundColor": "",
          "backgroundImage": { "url": "", "fullWidth": true, "repeat": false, "center": true, "cover": false },
          "padding": "0px"
        }
      }
    ],
    "headers": [],
    "footers": [],
    "values": {
      "backgroundColor": "#ffffff",
      "contentWidth": "600px",
      "fontFamily": { "label": "Arial", "value": "arial,helvetica,sans-serif" }
    }
  }
}
```

## Design guidelines

See the tagged [email design alternatives](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/react-email/STYLING.md#email-design-alternatives). Liquid fallbacks and the render check remain part of this template workflow.

## Prove it

- **The email template renders:** `workflows-show-email-template` after every create or update; marketing templates contain `{{ unsubscribe_url }}`; `text` is a real plain-text version; every Liquid variable has a `| default:` fallback.
