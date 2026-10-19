# Page trees and sitemap diagrams

Two formats for showing a site's structure, copied from coreyhaines31/marketingskills' `site-architecture` (MIT, SKILL.md and references/mermaid-templates.md): an ASCII tree for quick drafts and text-only contexts, and Mermaid diagrams for presentations, complex relationships, navigation zones and linking patterns. These are visual sitemaps for people; the XML sitemap search engines read is in [seo TECHNICAL-AUDIT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/TECHNICAL-AUDIT.md).

**Contents:** [ASCII tree](#ascii-tree) · [Basic Hierarchy](#basic-hierarchy) · [Hierarchy with Navigation Zones](#hierarchy-with-navigation-zones) · [Hierarchy with URL Labels](#hierarchy-with-url-labels) · [Hub-and-Spoke Content Model](#hub-and-spoke-content-model) · [Internal Linking Flow](#internal-linking-flow) · [Before/After Restructuring](#beforeafter-restructuring) · [Color-Coding Conventions](#color-coding-conventions) · [Prove it](#prove-it)

## ASCII tree

The page hierarchy deliverable, with the URL at every node [coreyhaines31/marketingskills, site-architecture]:

```
Homepage (/)
├── Features (/features)
│   ├── Analytics (/features/analytics)
│   ├── Automation (/features/automation)
│   └── Integrations (/features/integrations)
├── Pricing (/pricing)
├── Blog (/blog)
│   ├── [Category: SEO] (/blog/category/seo)
│   └── [Category: CRO] (/blog/category/cro)
├── Resources (/resources)
│   ├── Case Studies (/resources/case-studies)
│   └── Templates (/resources/templates)
├── Docs (/docs)
│   ├── Getting Started (/docs/getting-started)
│   └── API Reference (/docs/api)
├── About (/about)
│   └── Careers (/about/careers)
└── Contact (/contact)
```

## Mermaid templates

Copy-paste-ready diagrams; customize node labels and connections for the site. Use `graph TD` for hierarchies, with subgraphs for navigation zones where they help [coreyhaines31/marketingskills, site-architecture].

## Basic Hierarchy

Simple top-down page hierarchy.

```mermaid
graph TD
    HOME["Homepage<br/>/"] --> FEAT["Features<br/>/features"]
    HOME --> PRICE["Pricing<br/>/pricing"]
    HOME --> BLOG["Blog<br/>/blog"]
    HOME --> ABOUT["About<br/>/about"]

    FEAT --> F1["Analytics<br/>/features/analytics"]
    FEAT --> F2["Automation<br/>/features/automation"]
    FEAT --> F3["Integrations<br/>/features/integrations"]

    BLOG --> B1["Post: SEO Guide<br/>/blog/seo-guide"]
    BLOG --> B2["Post: CRO Tips<br/>/blog/cro-tips"]
```

---

## Hierarchy with Navigation Zones

Uses subgraphs to show which pages appear in which navigation area.

```mermaid
graph TD
    subgraph "Header Nav"
        HOME["Homepage"]
        FEAT["Features"]
        PRICE["Pricing"]
        BLOG["Blog"]
        CTA["Get Started ★"]
    end

    subgraph "Feature Pages"
        F1["Analytics"]
        F2["Automation"]
        F3["Integrations"]
    end

    subgraph "Footer Nav"
        ABOUT["About"]
        CAREERS["Careers"]
        CONTACT["Contact"]
        PRIVACY["Privacy"]
        TERMS["Terms"]
    end

    HOME --> FEAT
    HOME --> PRICE
    HOME --> BLOG
    FEAT --> F1
    FEAT --> F2
    FEAT --> F3
    HOME --> ABOUT
    ABOUT --> CAREERS
    HOME --> CONTACT
```

---

## Hierarchy with URL Labels

Each node shows the page name and URL path.

```mermaid
graph TD
    HOME["Homepage<br/><small>/</small>"] --> PROD["Product<br/><small>/product</small>"]
    HOME --> PRICE["Pricing<br/><small>/pricing</small>"]
    HOME --> BLOG["Blog<br/><small>/blog</small>"]
    HOME --> DOCS["Docs<br/><small>/docs</small>"]
    HOME --> ABOUT["About<br/><small>/about</small>"]

    PROD --> P1["Analytics<br/><small>/product/analytics</small>"]
    PROD --> P2["Reports<br/><small>/product/reports</small>"]

    DOCS --> D1["Getting Started<br/><small>/docs/getting-started</small>"]
    DOCS --> D2["API Reference<br/><small>/docs/api</small>"]
```

---

## Hub-and-Spoke Content Model

Shows a hub page connected to spoke articles, with spokes linking to each other.

```mermaid
graph TD
    HUB["SEO Guide<br/>(Hub Page)"]

    HUB --> S1["Keyword Research"]
    HUB --> S2["On-Page SEO"]
    HUB --> S3["Technical SEO"]
    HUB --> S4["Link Building"]

    S1 -.-> S2
    S2 -.-> S3
    S3 -.-> S4

    style HUB fill:#f9f,stroke:#333,stroke-width:2px
```

Legend:
- Solid lines = primary hub-spoke links
- Dashed lines = cross-links between spokes

---

## Internal Linking Flow

Shows how different site sections link to each other.

```mermaid
graph LR
    subgraph "Marketing"
        HOME["Homepage"]
        FEAT["Features"]
        PRICE["Pricing"]
    end

    subgraph "Content"
        BLOG["Blog"]
        GUIDE["Guides"]
        CASE["Case Studies"]
    end

    subgraph "Product"
        DOCS["Docs"]
        API["API Ref"]
        CHANGE["Changelog"]
    end

    BLOG --> FEAT
    BLOG --> CASE
    CASE --> FEAT
    CASE --> PRICE
    FEAT --> DOCS
    GUIDE --> BLOG
    GUIDE --> DOCS
    HOME --> FEAT
    HOME --> BLOG
    HOME --> CASE
```

---

## Before/After Restructuring

Compare current and proposed site structures side by side.

```mermaid
graph TD
    subgraph "Before"
        B_HOME["Homepage"] --> B_P1["Page 1"]
        B_HOME --> B_P2["Page 2"]
        B_HOME --> B_P3["Page 3"]
        B_HOME --> B_P4["Page 4"]
        B_HOME --> B_P5["Page 5"]
        B_HOME --> B_P6["Page 6"]
        B_HOME --> B_P7["Page 7"]
        B_HOME --> B_P8["Page 8"]
    end

    subgraph "After"
        A_HOME["Homepage"] --> A_S1["Features"]
        A_HOME --> A_S2["Resources"]
        A_HOME --> A_S3["Company"]
        A_S1 --> A_P1["Feature A"]
        A_S1 --> A_P2["Feature B"]
        A_S2 --> A_P3["Blog"]
        A_S2 --> A_P4["Guides"]
        A_S3 --> A_P5["About"]
        A_S3 --> A_P6["Contact"]
    end
```

---

## Color-Coding Conventions

Use styles to highlight page status, priority, or type.

```mermaid
graph TD
    HOME["Homepage"] --> FEAT["Features"]
    HOME --> PRICE["Pricing"]
    HOME --> BLOG["Blog"]
    HOME --> NEW["New Section"]
    HOME --> REMOVE["Deprecated Page"]

    FEAT --> F1["Existing Feature"]
    FEAT --> F2["New Feature"]

    style HOME fill:#4CAF50,color:#fff
    style PRICE fill:#4CAF50,color:#fff
    style FEAT fill:#4CAF50,color:#fff
    style BLOG fill:#4CAF50,color:#fff
    style F1 fill:#4CAF50,color:#fff
    style NEW fill:#2196F3,color:#fff
    style F2 fill:#2196F3,color:#fff
    style REMOVE fill:#f44336,color:#fff
```

Color key:
- **Green** (`#4CAF50`): Existing pages (no changes)
- **Blue** (`#2196F3`): New pages to create
- **Red** (`#f44336`): Pages to remove or redirect
- **Yellow** (`#FFC107`): Pages to restructure or move
- **Purple** (`#9C27B0`): High-priority / CTA pages

---

## Prove it

The ASCII tree and the Mermaid diagram show the same pages and URLs as the URL map; each diagram renders in a Mermaid viewer without a syntax error; a restructure diagram uses the colour key and its legend; and every red (remove or redirect) node has a row in the redirect map ([PLATFORMS-AND-MIGRATION.md](PLATFORMS-AND-MIGRATION.md#migrating-without-losing-traffic)).
