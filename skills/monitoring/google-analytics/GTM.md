# Google Tag Manager

Running tracking through a Tag Manager container: what a container holds, naming, dataLayer patterns, the Google tag and event tags, pixels, preview, workspaces and versions, sequencing and custom JavaScript variables. Rules are from the analytics skill of coreyhaines31/marketingskills (MIT, references/gtm-implementation.md) unless tagged with a Google URL. Consent settings per tag are in [CONSENT-MODE.md](CONSENT-MODE.md#tag-manager).

**Contents:** [Container structure](#container-structure) · [Naming](#naming) · [dataLayer patterns](#datalayer-patterns) · [Tag configurations](#tag-configurations) · [Preview and debug](#preview-and-debug) · [Workspaces and versions](#workspaces-and-versions) · [Advanced patterns](#advanced-patterns) · [Custom JavaScript variables](#custom-javascript-variables) · [Prove it](#prove-it)

## Container structure

[coreyhaines31/marketingskills, analytics]

| Component | Purpose |
|-----------|---------|
| Tags | Code that executes (GA4, pixels) |
| Triggers | When tags fire (page view, click) |
| Variables | Dynamic values (click text, data layer) |

- **Common tags:** the Google tag (base setup), Google Analytics event tags, Google Ads Conversion, Meta Pixel, LinkedIn Insight Tag, Custom HTML for other pixels.
- **Built-in triggers:** Page View (All Pages, DOM Ready, Window Loaded); Click (All Elements, Just Links); Form Submission; Scroll Depth; Timer; Element Visibility. **Custom triggers:** Custom Event (from the dataLayer); Trigger Groups (multiple conditions).
- **Built-in variables** (enable as needed): Click Text, Click URL, Click ID, Click Classes; Page Path, Page URL, Page Hostname; Referrer; Form Element, Form ID. **User-defined:** Data Layer variables, JavaScript variables, Lookup tables, RegEx tables, Constants.

The source's tag list said "GA4 Configuration (base setup)" and "Facebook Pixel"; the configuration tag is now the Google tag ([Tag configurations](#tag-configurations)).

## Naming

[coreyhaines31/marketingskills, analytics]

```
[Type] - [Description] - [Detail]

Tags:
GA4 - Event - Signup Completed
GA4 - Config - Base Configuration
FB - Pixel - Page View
HTML - LiveChat Widget

Triggers:
Click - CTA Button
Submit - Contact Form
View - Pricing Page
Custom - signup_completed

Variables:
DL - user_id
JS - Current Timestamp
LT - Campaign Source Map
```

## dataLayer patterns

[coreyhaines31/marketingskills, analytics]

```javascript
// Initialize (in <head> before GTM)
window.dataLayer = window.dataLayer || [];

// Push event
dataLayer.push({
  'event': 'event_name',
  'property1': 'value1',
  'property2': 'value2'
});
```

Page-load data, set before the container:

```javascript
window.dataLayer = window.dataLayer || [];
dataLayer.push({
  'pageType': 'product',
  'contentGroup': 'products',
  'user': {
    'loggedIn': true,
    'userId': '12345',
    'userType': 'premium'
  }
});
```

Form submission and button click:

```javascript
document.querySelector('#contact-form').addEventListener('submit', function() {
  dataLayer.push({
    'event': 'form_submitted',
    'formName': 'contact',
    'formLocation': 'footer'
  });
});

document.querySelector('.cta-button').addEventListener('click', function() {
  dataLayer.push({
    'event': 'cta_clicked',
    'ctaText': this.innerText,
    'ctaLocation': 'hero'
  });
});
```

Ecommerce: clear the previous `ecommerce` object before each ecommerce push.

```javascript
// Product view
dataLayer.push({ ecommerce: null }); // Clear previous
dataLayer.push({
  'event': 'view_item',
  'ecommerce': {
    'items': [{
      'item_id': 'SKU123',
      'item_name': 'Product Name',
      'price': 99.99,
      'item_category': 'Category',
      'quantity': 1
    }]
  }
});

// Add to cart
dataLayer.push({ ecommerce: null });
dataLayer.push({
  'event': 'add_to_cart',
  'ecommerce': {
    'items': [{
      'item_id': 'SKU123',
      'item_name': 'Product Name',
      'price': 99.99,
      'quantity': 1
    }]
  }
});

// Purchase
dataLayer.push({ ecommerce: null });
dataLayer.push({
  'event': 'purchase',
  'ecommerce': {
    'transaction_id': 'T12345',
    'value': 99.99,
    'currency': 'USD',
    'tax': 5.00,
    'shipping': 10.00,
    'items': [{
      'item_id': 'SKU123',
      'item_name': 'Product Name',
      'price': 99.99,
      'quantity': 1
    }]
  }
});
```

## Tag configurations

The base tag is the **Google tag**: "a single tag you can add to your website to send data from your website to linked Google product destinations", connected "to multiple destinations (like Google Ads and Google Analytics)"; "All global site tags have been converted into Google tags." If you use both Google Ads and Google Analytics, "only set up the Google tag in one platform" and add the other as a destination (https://support.google.com/tagmanager/answer/12002338). Events go out through a "Google Analytics: Google Analytics Event tag" (https://support.google.com/analytics/answer/7201382). The source's tag types "Google Analytics: GA4 Configuration" and "Configuration Tag: Select your config tag" are the old names.

Settings the source gives [coreyhaines31/marketingskills, analytics]:
- **Google tag:** measurement ID `G-XXXXXXXX`; user properties for user-level dimensions; trigger All Pages.
- **Event tag:** event name from `{{DL - event_name}}` or hardcoded; event parameters from the dataLayer; trigger a Custom Event matching the event name.
- **Meta Pixel** (the source's "Facebook Pixel"), as Custom HTML. Base, trigger All Pages:

```html
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

Event, trigger Custom Event `form_submitted`:

```html
<script>
  fbq('track', 'Lead', {
    content_name: '{{DL - form_name}}'
  });
</script>
```

A non-Google tag like this ignores Google's consent signals unless you give it consent settings ([CONSENT-MODE.md](CONSENT-MODE.md#tag-manager)). Pixel and conversions API setup for ad networks is [paid-ads SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md).

## Preview and debug

[coreyhaines31/marketingskills, analytics] Click **Preview** in GTM, enter the site URL, and the debug panel opens. Check: tags fired on each event, tags not fired and why, variables and their values, the data layer contents.

| Problem | Check |
|---|---|
| Tag not firing | trigger conditions; the data layer push; tag sequencing |
| Wrong variable value | data layer structure; the variable path (nested objects); timing (the data may not exist yet) |
| Multiple firings | trigger uniqueness; duplicate tags; tag firing options |

## Workspaces and versions

[coreyhaines31/marketingskills, analytics]
- Default workspace for production; separate workspaces for large changes; merge when ready.
- Name every version descriptively, add notes explaining the changes, review changes before publishing, keep the production version noted.

```
v15: Added purchase conversion tracking
- New tag: GA4 - Event - Purchase
- New trigger: Custom Event - purchase
- New variables: DL - transaction_id, DL - value
- Tested: Chrome, Safari, Mobile
```

## Advanced patterns

[coreyhaines31/marketingskills, analytics]
- **Tag sequencing** (Tag Configuration, Advanced Settings, Tag Sequencing): the Google tag before event tags, pixel initialization before tracking, cleanup after a conversion.
- **Trigger exceptions** keep a tag from firing on certain pages, for internal traffic or during testing.

## Custom JavaScript variables

[coreyhaines31/marketingskills, analytics]

```javascript
// Get URL parameter
function() {
  var params = new URLSearchParams(window.location.search);
  return params.get('campaign') || '(not set)';
}

// Get cookie value
function() {
  var match = document.cookie.match('(^|;) ?user_id=([^;]*)(;|$)');
  return match ? match[2] : null;
}

// Read a machine-readable amount, not the localized display text.
// Example: <span class="product-price" data-price="1234.56">$1,234.56</span>
function() {
  var el = document.querySelector('.product-price');
  var raw = el ? el.getAttribute('data-price') : null;
  if (raw === null || !/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(raw)) return null;
  var amount = Number(raw);
  return isFinite(amount) ? amount : null;
}
```

"For monetary tracking, prefer the numeric amount and currency from the application data layer. If a DOM variable is needed, have the application render `data-price` as an unformatted, non-negative decimal in major currency units; pass its currency separately. Do not infer the amount or currency from presentation text: `parseFloat` turns `$1,234.56` into `1` after removing `$`, and localized separators have different meanings. A missing or invalid amount returns `null`, so skip that monetary event or diagnose it before sending; reserve `0` for an explicitly free item."

## Prove it

In Preview, each tag fires once on its intended trigger and not elsewhere, every variable resolves to the expected value, and the container holds no second copy of a tag the site also loads directly; the price variable returns `1234.56` for `data-price="1234.56"`, `null` when the attribute is missing, empty or localized (`1.234,56`, `$1,234.56`), and `0` only for an item rendered as `data-price="0"`; every published version has a descriptive name and notes listing what changed and where it was tested.
