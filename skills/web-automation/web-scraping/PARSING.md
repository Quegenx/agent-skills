# Parsing HTML

From [D4Vinci/Scrapling, scrapling-official/references/parsing], with the class-token qualification checked against [lxml.cssselect](https://lxml.de/cssselect.html).

**Contents:** [Choosing a selector](#choosing-a-selector) · [Option: Scrapling Selector](#option-scrapling-selector-vendor) · [Selecting](#selecting) · [Similar elements](#similar-elements) · [Adaptive selectors](#adaptive-selectors) · [Coming from BeautifulSoup](#coming-from-beautifulsoup) · [Pitfalls](#pitfalls) · [Prove it](#prove-it)

## Choosing a selector

- **Prefer CSS for convenient class-token matching.** Exact whole-class attribute equality misses elements with another class, but an appropriate XPath token expression works: lxml itself compiles CSS class selection to XPath with whitespace-normalized token membership. The source example and old line generalized the failure of whole-attribute equality into a limitation of XPath. [https://lxml.de/cssselect.html; D4Vinci/Scrapling, scrapling-official/references/parsing/selection.md]
- **Select narrowly** so only the content you need reaches the next step (UNTRUSTED-CONTENT.md).
- **Resolve relative links to absolute URLs** (`page.urljoin(href)`) before following them.
- **For repeated items** (products, table rows, form fields, reviews), find one by its text, walk up to its container, then find the elements similar to it.
- **For sites that get redesigned**, save an element's properties once and relocate it by similarity later (adaptive selectors).

## Option: Scrapling Selector (vendor)

Built on lxml and cssselect. HTML only: no XML feeds, because adaptive matching does not work with XML (the crawler's feed template handles XML, CRAWLING.md).

- **Create:** `from scrapling import Selector`, `Selector(html, url=...)`. Args: `encoding` (default UTF-8), `keep_comments` (off); `url`, `adaptive`, `storage`, `storage_args` for adaptive. Properties load lazily. A fetcher's response is already a `Selector`.
- **Types:** `Selector`, `Selectors` (list subclass), `TextHandler` (str subclass), `TextHandlers`, `AttributesHandler` (read-only dict).
- **Read-only DOM:** it cannot modify the parsed document.
- **Text:** `.text` is direct text only; `.get_all_text(separator='\n', strip=False, ignore_tags=('script','style'), valid_values=True)` for everything below.
- **Attributes:** `el.attrib['x']`, `el['x']`, `'x' in el`; `attrib.search_values(v, partial=True)` returns a generator, so wrap it in `list()` inside filters; `attrib.json_string` returns bytes.
- **HTML:** `.html_content`, `.prettify()`, `.body`. Ancestors: `.path`.
- **Generated selectors:** `generate_css_selector`, `generate_full_css_selector`, `generate_xpath_selector`, `generate_full_xpath_selector`. The short form stops at a unique element such as one with an `id`; with none, short equals full.
- **Traversal:** `parent`, `children`, `below_elements` (all descendants), `siblings`, `next`, `previous`, `has_class()`, `iterancestors()`, `find_ancestor(fn)`.
- **Results:** every selection returns `Selector`/`Selectors`, text nodes included (`tag == "#text"`). `get()`, `getall()`, `extract_first`, `extract`; `Selectors.get(default=None)`; `.first` and `.last` return `None` instead of raising; `.length`; `Selectors.search(fn)` returns the first match, `.filter(fn)` all matches.
- **Text helpers:** `re(pattern, replace_entities=True, clean_match=False, case_sensitive=True)`, `re_first`; `.json()` on text or an element; `.clean()` (collapse whitespace, `remove_entities`); `.sort(reverse=)`.
- **Links:** `page.urljoin(relative)`.

The former `keep_cdata` option was removed in 0.5, without replacement; this includes global and per-request selector settings and display_config. The old source still listed it. [https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md]

## Selecting

Five ways:

| Way | Notes |
|---|---|
| CSS3 | cssselect plus `::text` and `::attr(name)` (Scrapy and Parsel conventions), `:contains("x")` |
| XPath | lxml; **no `has-class` extension**, use `.has_class()` |
| Filters | `find` / `find_all` |
| Text | `find_by_text` |
| Regex | `find_by_regex` |

- **`find_all` filter order:** tag names (string or iterable), then an attribute dict or kwargs (`class_=`), then regex patterns, then functions. Argument order doesn't matter. Attribute operators: `{'href$': 'Einstein'}`, `{'href*': '/author/'}`.
- **`find_by_text` / `find_by_regex`:** `first_match=True`, `case_sensitive`, `clean_match`; `find_by_text` adds `partial` (exact match by default). The docs' example says partial search is case-insensitive by default.

## Similar elements

`find_similar(similarity_threshold=0.2, ignore_attributes=('href','src'), match_text=False)` matches elements at the same DOM depth, then the same tag, parent and grandparent tags, then fuzzy attribute matches. The result excludes the element itself.

Pattern: `find_by_text` for one card, `find_ancestor` to its container, then `find_similar()` for the rest.

## Adaptive selectors

A selector breaks when the site's markup changes. Adaptive scraping stores an element's properties when the selector still works and relocates the element by similarity when it no longer does.

- **Enable:** `Selector(..., adaptive=True, url=...)` or `Fetcher.adaptive = True`.
- **Save then relocate:** `page.css(sel, auto_save=True)` once; later `page.css(sel, adaptive=True)`. Manual: `page.save(el, 'id')`, `page.retrieve('id')`, `page.relocate(dict, selector_type=True)`.
- **Storage:** SQLite by default, keyed by domain plus identifier (the selector string unless you pass `identifier=`). **Always pass a `url`:** without one the domain is `default`, which collides across sites that use the same identifier. A save overwrites; only the latest properties are used.
- **Moved sites:** `adaptive_domain` treats two domains as one (a site moved to a new URL, or archive.org versus the live site).
- **What is stored:** tag, text, attributes, sibling tag names, path tag names, and the parent's tag, attributes and text. Matching is by similarity and includes class order.
- **Only the first element of a selection is saved;** comma-combined selectors are split and each runs alone.
- **When relocation fails:** check `retrieve()`, try an old `identifier`, re-save under a new identifier, use a more specific selector, or save the parent for context.

## Coming from BeautifulSoup

| BeautifulSoup | Scrapling |
|---|---|
| `select_one` | `css(...).first` |
| `str(soup)` | `html_content` |
| `.name` | `.tag` |
| `.string` | `.text` |
| `get_text` | `get_all_text` |
| `.attrs` | `.attrib` |
| `parents` | `iterancestors()` |
| `find_parent("a")` | `find_ancestor(lambda p: p.tag == 'a')` |
| `next_sibling` | `.next` |
| `find_next_sibling(s)` | `siblings.search` / `siblings.filter` |
| `find_next` / `find_all_next` | `below_elements.search` / `below_elements.filter` |
| `descendants` | `below_elements` |
| `find(text=)` | `find_by_text(partial=False)` |

BeautifulSoup's `find_previous` searches all preceding elements in document order; Scrapling's `path` covers only ancestors. Scrapling always uses lxml. `find()` returns `None` when nothing matches; `css()` returns an empty `Selectors`.

## Pitfalls

- **`page.css('div::text').get().json()` errors when the div has no direct text.** For a JSON `<script>` nested inside, use `get_all_text(ignore_tags=[]).json()`.
- **A JSON string passed to `Selector` is treated as broken HTML** and wrapped in `<html><body><p>`; `.json()` still works.

## Prove it

The selector returns the expected count on a saved copy of the page, `.first` on an empty selection gives `None` rather than an exception, and extracted URLs are absolute. For adaptive selectors: save with a `url`, edit the saved HTML (rename a class, move the element), and `css(sel, adaptive=True)` still finds it.
