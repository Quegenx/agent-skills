# Personalization

Filling messages with per-recipient data: Liquid syntax, where each kind of data comes from, templates, API `custom_data`, Data Feeds and multi-language messages. Liquid renders per recipient just before delivery, so pick the data source deliberately: tags and properties persist and work in Journeys, `custom_data` exists only for the one API request, Data Feeds call your API at send time (and skip the recipient if the call fails), and in-app messages read tags only. Segments and tags as targeting are in [SEGMENTS.md](SEGMENTS.md); in-app message languages in [IN-APP-MESSAGES.md](IN-APP-MESSAGES.md); Journey event data in [JOURNEYS.md](JOURNEYS.md); HTML in-app Liquid in [IAM-HTML.md](IAM-HTML.md#liquid-in-html); the send endpoints in [REST-API.md](REST-API.md).

## Where Liquid works

| Channel | Fields |
|---|---|
| Email | Subject, reply-to, pre-header, body, image src, button URLs |
| Push | `headings`, subtitle, `contents`, image URL, launch URL (e.g. `https://example.com/{{last_category_viewed}}`). Not `data` |
| SMS | `contents` |
| In-app | Tag substitution only (no `journey.*`, `message.*`, `subscription.*`, `user.*`). Tags must be set before the session starts; the available tags are what `getTags` returns |
| Live Activities | `event_updates`, `contents`, `headings` |
| Journey webhooks | All fields; see [SERVER-AND-SUPABASE.md](SERVER-AND-SUPABASE.md#journey-webhooks) |

## Data sources

| Source | Stored | In Journeys | Use for |
|---|---|---|---|
| Properties (tags, External ID) | yes | yes | Persistent user data |
| Custom Events | only when they start a Journey or match a Wait Until | entry and Wait Until only (`journey.first_event`, `journey.last_event`, `journey.event.EVENT_NAME`) | Event properties |
| API `custom_data` | no, current request only | no | OTPs, secure links, arrays |
| Data Feeds | no, a live API call at send time | Journeys only | Live data |
| Dynamic Content | CSV | | |
| Brand Kit | | | e.g. `{{ brand_assets.colors.primary.hex }}` |

- **Common mistakes:** tags for OTPs (use `custom_data`); expecting `custom_data` in Journeys; using Custom Event properties outside the Journey entry or Wait Until; Data Feeds for static data; Liquid in the push `data` field.

## Liquid syntax

- **Output tags `{{ ... }}`, logic tags `{% ... %}`.** A missing value renders an empty string and the message still sends.
- **Tag values are strings:** compare `level == "1"` or cast with `{% assign n = level | plus: 0 %}`.
- **Conditions evaluate right to left,** with no parentheses.
- **Bracket notation for special keys:** `{{ user.tags["order status"] }}`, `{{ journey.first_event.properties["order-id"] }}`, `{{ message.custom_data["full name"] }}`.
- **`default` only when the surrounding text stays the same;** otherwise use `if`/`else`.
- **Whitespace control:** `{{- -}}`, `{%- -%}`. Wrap user-generated content in `{% raw %}...{% endraw %}`.
- **`for` loops can degrade delivery performance** in rare cases; be mindful on high-volume sends. The push fields `contents`, `headings`, `subtitle`, `apns_alert` and `url` do **not** support `for` loops.
- **Filters:**
  - `default`, `round`, `pluralize` (OneSignal-only).
  - `date` (strftime). A Unix-seconds tag (e.g. `bill_due: 1687968776`) works for both Liquid and Time Operator segmentation; `"now"` is evaluated per recipient at send time.
  - Math: `plus`, `minus`, `times`, `divided_by`, `modulo`.
  - Arrays: `size`, `first`, `last`, `where`, `join`, `split`.
  - Strings: `replace`, `replace_first`, `capitalize`, `upcase`, `downcase`, `strip`, `lstrip`, `rstrip`, `strip_html`, `truncate`, `truncatewords`, `prepend`, `append`, `url_encode`, `escape`.

## Templates

- **Per channel** (push, email, SMS) only. `template_id` is a UUID v4; send through the API with `template_id`.
- **API fields override the template for that send** (`contents`, `headings`, `email_body`).
- **Updating** a template doesn't reset its metrics or change past messages. Deleting is unrecoverable, and templates used in a Journey can't be deleted. Copying between apps is one-time, not a live sync.
- **Analytics:** aggregate template analytics are lifetime; per-send data follows plan retention ([ANALYTICS-AND-PRIVACY.md](ANALYTICS-AND-PRIVACY.md)). Template CTR = Clicked / Delivered.
- **Use templates for API and transactional sends** to keep performance history beyond the 30-day API message retention.

## API `custom_data`

Use message-specific, ephemeral data for OTPs, temporary links or arrays; choose persistent tags or Journey data using [Data sources](#data-sources). The `template_id` requirement, Liquid prefix, missing-field behavior, arrays, bulk JSON, matching External IDs and per-channel size limits are maintained once in [REST-API.md](REST-API.md#transactional-sends-and-custom_data).

Push template (Message field):

```liquid
{% assign cart = message.custom_data.cart %}
{% assign item_count = cart.size | plus: 0 %}
{% if item_count == 1 %}
You left {{cart.first.product_name}} in your cart.
{% endif %}
{% if item_count == 2 %}
You left {{cart.first.product_name}} and {{item_count | minus: 1}} more item in your cart.
{% endif %}
{% if item_count > 2 %}
You left {{cart.first.product_name}} and {{item_count | minus: 1}} more items in your cart.
{% endif %}
```

## Data Feeds

- **Only for email and SMS/RCS messages sent through Journeys** (no push).
- **Configure** at **Settings > Data feeds**: Name, Alias (unique, lowercase alphanumeric), Method `GET`/`POST`, URL, Headers and Body (Liquid allowed). Attach it to a template via **Personalization > Data Feeds** and reference `{{ data_feed.<alias>.<field> }}`. A Journey event property in the URL: `{{ journey.event.cart_abandoned.data.cart_id }}`.
- **Your API must:** use header auth, respond in under 250ms (recommended), return JSON only under 50 KB, and handle the send volume (10,000 users means 10,000 calls). Disallowed headers are the same as for Journey webhooks.
- **Limits:** one Data Feed per template, one call per feed per message, no chaining.
- **If the call fails or returns no data, the message won't be sent to that recipient;** no fallback is inserted.
- **Tests** run against Test Users.

## Multi-language

- **Language:** the SDKs set `language` from the device language when the user is created; update it with `setLanguage`, the Create/Update user `language` field, or the CSV importer. Codes are ISO 639-1, except `zh-Hans` and `zh-Hant`.
- **Push and SMS** take a language map in `contents`, which requires `en` (the fallback). `headings` is required for web push and Huawei; `subtitle` is iOS only.
- **Email has no language map:** use Liquid on `user.language`, Dynamic Content, or per-language segments or templates.
- **In-app messages** use **Add Languages** (block, HTML and Journey in-app steps), driven by the language property. In-app Liquid cannot read `user.language` (`setLanguage` does not change tag branches): set a `language` tag with the same code before the session starts. Each language variant has its own 1 MB size limit.
- **Right-to-left:** the push editor stores text as HTML, so add a right-to-left mark after characters like `%`.

```json
{
  "app_id": "YOUR_APP_ID",
  "target_channel": "push",
  "included_segments": ["Subscribed Users"],
  "contents": {
    "en": "Your order has shipped.",
    "fr": "Votre commande a été expédiée.",
    "zh-Hans": "您的订单已发货。"
  },
  "headings": {
    "en": "Order update",
    "fr": "Suivi de commande",
    "zh-Hans": "订单更新"
  },
  "subtitle": {
    "en": "Track your package",
    "fr": "Suivez votre colis",
    "zh-Hans": "追踪您的包裹"
  }
}
```

## Prove it

- **No OTP or secure link is stored in a tag;** they travel in `custom_data` with a `template_id`, and the data respects [REST-API.md’s per-channel caps](REST-API.md#transactional-sends-and-custom_data).
- **No Journey template references `message.custom_data`.**
- **Push `data` contains no Liquid,** and `contents`, `headings`, `subtitle`, `apns_alert` and `url` contain no `for` loops.
- **Numeric tag comparisons** cast with `plus: 0` or compare against a quoted string.
- **Every localized push** has an `en` key in `contents`.
- **A Data Feed endpoint** answers under 250ms with JSON under 50 KB, and a test send to a Test User fills every `{{ data_feed.<alias>.<field> }}`; a failing call shows as a recipient who did not receive the message.
- **Every variable has a fallback:** each `{{ }}` has a `default` filter or sits inside an `if`, and a send to a user missing the value reads correctly.
- **Bulk sends:** every recipient in `include_aliases.external_id` has a key in `custom_data.users`.
- **In-app language:** for Liquid language branches, the `language` tag (same code as the language property) is set before the session starts.
