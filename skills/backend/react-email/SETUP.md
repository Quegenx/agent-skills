# Setup

React Email turns React and TypeScript components into email HTML, and it is built to be adopted incrementally. Since 6.0 one package, `react-email`, exports every component and the render utilities; the preview server is the separate `@react-email/ui` package and the visual editor is `@react-email/editor`, neither included in `react-email`.

**Contents:** [Versions](#versions) · [Install](#install) · [Project layout](#project-layout) · [The preview server and CLI](#the-preview-server-and-cli) · [Custom esbuild plugins](#custom-esbuild-plugins) · [Deploying the preview](#deploying-the-preview) · [Changes by version](#changes-by-version) · [Prove it](#prove-it)

## Versions

| Package | Latest (2026-10-16) | What it is |
|---|---|---|
| `react-email` | 6.11.3 | All components, `render`, `pretty`, `toPlainText`, `pixelBasedPreset`, the `email` CLI. `"engines": { "node": ">=20.19.0" }` |
| `@react-email/ui` | 6.11.3 | The preview server (renamed from `@react-email/preview-server` in 6.0) |
| `@react-email/render` | 2.1.1 | The render utilities as their own package |
| `@react-email/editor` | 1.7.14 | The embeddable visual editor ([EDITOR.md](EDITOR.md)) |

- **Node 20.19 or later.** The CLI needs it since react-email@6.10.0 (2026-09-23, chokidar v5); the dev server refuses to start on older Node.
- **Newer releases are only on GitHub.** The docs changelog's newest entry is April 16, 2026 (6.0.0); later releases are listed at https://github.com/resend/react-email/releases.

## Install

- **New project (recommended):** `npx create-email@latest` (or `yarn create email`, `pnpm create email`, `bun create email`). It creates a `react-email-starter` folder with a few templates. Then `cd react-email-starter`, `npm install`, `npm run dev`, open localhost:3000 and edit the files in `emails`.
- **Existing project, manual setup:** install the preview server as a dev dependency and the runtime packages as dependencies, with exact versions:
  ```sh
  npm install @react-email/ui -D -E
  npm install react-email react react-dom -E
  ```
  (`yarn add`, `pnpm add`, `bun add` take the same flags.) Add the script `"email:dev": "email dev"`, create `emails/email.tsx`, run `npm run email:dev` and open localhost:3000.
- **First template from the manual setup guide:**
  ```jsx
  import { Button, Html, Head, Body } from "react-email";
  import * as React from "react";

  export default function Email() {
    return (
      <Html>
        <Head />
        <Body>
          <Button
            href="https://example.com"
            style={{ background: "#000", color: "#fff", padding: "12px 20px" }}
          >
            Click me
          </Button>
        </Body>
      </Html>
    );
  }
  ```
- **Script with an explicit folder and port** (the vendor skill's form):
  ```json
  {
    "scripts": {
      "email": "email dev --dir emails --port 3000"
    }
  }
  ```
  Keep the emails folder path relative to the base project directory, and make sure `tsconfig.json` supports JSX.
- **Plain Node application:** the integrations overview offers installing `@babel/preset-typescript` and adding a `.babelrc` with `{"presets": ["@babel/preset-typescript"]}`.
- **Monorepo (npm, pnpm, yarn, bun):** create a `transactional` folder where workspace packages live (generally `./packages/*`) with its own `package.json`, register it in `pnpm-workspace.yaml` (pnpm) or the root `workspaces` (yarn), install `@react-email/ui -D -E` and `react-email react react-dom -E` in that workspace, and add the script `"dev": "email dev"`. Example repos: `resend/react-email-turborepo-{npm,pnpm,yarn,bun}-example`.
- **Yarn modern needs `node-modules`.** React Email works only with yarn's `node-modules` and `pnpm` install modes: set `nodeLinker: node-modules` in `.yarnrc.yml`. Yarn classic (1.x) users follow the pnpm guide.
- **Migrating from MJML:** remove `mjml`, install `react-email`, convert `.mjml` templates to `.tsx`/`.jsx`, replace MJML tags with React Email components (`<Text>`, `<Img>`, `<Button>`), and convert custom MJML `.js` components to React components.
- **Import only what you use** from `react-email`, and use no component you haven't imported. Since 6.8.0 (2026-07-13) importing a component no longer pulls `prismjs`, `marked` and `tailwindcss` into the bundle unless `CodeBlock`, `Markdown` or `Tailwind` is actually used.

## Project layout

- **What counts as an email:** a `.js`, `.jsx` or `.tsx` file in the emails directory (default `emails`) that contains `export default` (matched by `/\bexport\s*default\b/gm`).
- **Hide shared code from the sidebar:** prefix a directory with `_` (for example `_components`).
- **Static files** go in a `static` directory inside the emails directory (it follows `--dir`, for example `./src/emails/static`) and are served at `http://localhost:3000/static/...`. They are not hosted for sending: a rendered email that points at them will not load them. Switch the base URL by environment:
  ```tsx
  const baseURL = process.env.NODE_ENV === "production"
    ? "https://cdn.example.com"  // User's production CDN
    : "";

  export default function Email() {
    return (
      <Img
        src={`${baseURL}/static/logo.png`}
        alt="Logo"
        width="150"
        height="50"
      />
    );
  }
  ```
  In dev the empty base URL makes `/static/logo.png` load from the dev server; in production it becomes `https://cdn.example.com/static/logo.png`. Ask for the production hosting URL and never hardcode `localhost:3000`.
- **Preview-only props:** set `Email.PreviewProps = { ... }` on the default-exported component; the preview renders `<Email {...Email.PreviewProps} />`. Include only props the component actually uses. The vendor skill types them with `satisfies WelcomeEmailProps`; its pattern and i18n examples use `as WelcomeEmailProps` instead.
- **Export both ways:** the canonical template has a default export plus a named export, and a props interface. See [COMPONENTS.md](COMPONENTS.md).
- **A shared brand config** lives at `emails/tailwind.config.ts` ([STYLING.md](STYLING.md)).

## The preview server and CLI

The `email` binary ships in `react-email`.

| Command | What it does | Options |
|---|---|---|
| `email dev` | Starts a local server that watches files and rebuilds automatically | `--dir` (default `emails`), `--port` (default `3000`), `--esbuild-plugins`, `--clients` |
| `email build` | Copies the preview app onto `.react-email` and builds it for production | `--dir` (default `emails`), `--packageManager` (default `npm`), `--esbuild-plugins` |
| `email start` | Runs the built preview app inside `.react-email` | no `--esbuild-plugins` |
| `email export` | Generates plain HTML files into `out` | `--outDir` (default `out`), `--pretty` (default false), `--plainText` (default false), `--dir` (default `emails`), `--extension` (for example `blade.php`; default `.html`, or `.txt` with `--plainText`), `--esbuild-plugins` |
| `email resend setup` | Stores a Resend API key in a home-directory config (interactive) | |
| `email resend reset` | Removes the stored Resend API key | |
| `email help <cmd>` | Help for one command | |

- **Narrow compatibility warnings:** `email dev --clients outlook,apple-mail` or the env var `COMPATIBILITY_EMAIL_CLIENTS` picks which clients trigger warnings. The default warns for `gmail`, `apple-mail`, `outlook`, `yahoo`; the CLI flag wins over the env var; an empty or fully invalid list falls back to the defaults. Added in 6.5.0 (2026-05-27).
- **The toolbar** (4.0.0, Mar 27, 2025) does image and link validation, compatibility checking and spam scoring. Since ui@6.6.6 (2026-07-02) `email build` logs a warning instead of failing when the spam check API errors or times out.
- **Live-edit props** in the toolbar's Props tab without changing `PreviewProps` (invalid JSON is flagged, reset restores the defaults), added in 6.8.0 (2026-07-13). Since ui@6.9.0 (2026-07-15) the props editor is a collapsible side panel with a JSON editor, and static builds show the props read-only.
- **Dark mode switcher:** the preview emulates email client color inversion (5.0.0, Nov 7, 2025). See [STYLING.md](STYLING.md#dark-mode).
- **HTML templates** can be previewed too (ui@6.3.0, 2026-05-21).
- **Prefer `render` over `email export`.** Rendering at the moment of sending, with the data passed as props, is the primary way; it adds milliseconds. Export only when a backend in a language other than JavaScript must process the email, or a platform such as Shopify forces manual templating.
- **`--packageManager` on `email build` is deprecated** since 6.1.4 (2026-05-13): only npm is supported, and build dependency installation includes dev dependencies. The CLI docs still list the option.
- **Upload templates to Resend:** `npx react-email@latest resend setup` asks for an API key (scoped to Full Access), then the preview toolbar's "Resend" tab has "Upload" and "Bulk Upload". Remove the key with `npx react-email@latest resend reset`. Since ui@6.6.3 (2026-06-16) uploading updates an existing Resend template with the same name when exactly one matches, instead of creating a duplicate. Sending by template id is in [RENDERING-AND-SENDING.md](RENDERING-AND-SENDING.md).

## Custom esbuild plugins

- **What they're for:** React Email bundles each template with esbuild. `--esbuild-plugins` adds your plugins for compile-time transforms, custom resolvers (virtual modules, build-time data) and file types esbuild doesn't load. The module default-exports an array of plugins, or a sync or async function returning one, in JS or TS. Added in 6.11.0 (2026-09-23).
- **Pass it to every bundling command,** with a path relative to the working directory:
  ```json
  {
    "scripts": {
      "dev": "email dev --esbuild-plugins ./esbuild-plugins.mjs",
      "build": "email build --esbuild-plugins ./esbuild-plugins.mjs",
      "export": "email export --esbuild-plugins ./esbuild-plugins.mjs"
    }
  }
  ```
- **Cache anything expensive:** the preview server bundles a template again every time it renders it.
- **Restart `email dev` after editing a plugin:** plugins load once per process. Load errors show in the preview, and React Email's own plugins run first.

## Deploying the preview

- **Vercel:** add `"build": "email build"`, set the Framework Preset to Next.js and add `"next": "latest"` to devDependencies (a limitation of Vercel's Next.js preset), and set the Output Directory to `.react-email/.next`.

## Changes by version

- **6.0.0 (April 16, 2026):** every component and render utility is exported from `react-email`; `@react-email/components` and the individual packages are no longer needed; `@react-email/preview-server` is renamed `@react-email/ui`. All packages except `@react-email/render` and `@react-email/ui` are being deprecated. Move `react-email` to `dependencies`. Migrate with:
  ```sh
  npm uninstall @react-email/components @react-email/preview-server
  npm install react-email@latest @react-email/ui@latest
  ```
  ```tsx
  import { Button, Html, Head, render } from "@react-email/components"; // [!code --]
  import { Button, Html, Head, render } from "react-email"; // [!code ++]
  ```
- **5.0.0 (Nov 7, 2025):** replace every `renderAsync` with `render`; Tailwind 4 via `@react-email/tailwind@2.0.0`, which no longer inlines styles on component props; the compatibility checker supports Tailwind 4 only; dark mode switcher; Templates API integration; Components 1.0.0; Render 2.0.0.
- **4.1.0 (Jul 08, 2025):** the preview server moved to its own package, `@react-email/preview-server`, versioned with `react-email`.
- **4.0.0 (Mar 27, 2025):** the toolbar with image and link validation, compatibility checking and spam scoring.
- **3.0.4 (Dec 09, 2024):** updated to React 19.
- **Tailwind 1.0.0 (Oct 31, 2024):** requires `@react-email/render@>=1.0.0`.
- **3.0.0 (Aug 22, 2024):** `email dev` uses a built version of the preview app (major change); React 19 peer support; `render` returns a promise (`@react-email/render@1.0.0`).
- **Preview server security fixes:** path traversal in `renderEmailByPath`/`getEmailPathFromSlug` closed (ui@6.3.3, 2026-05-25); the server action no longer accepts a directory path from the client and reads `REACT_EMAIL_INTERNAL_EMAILS_DIR_ABSOLUTE_PATH` (ui@6.3.1, 2026-05-22).
- **`email export` fixes:** it no longer deletes the project, home directory, templates or static assets when `--outDir` points at them (6.11.1, 2026-10-06); out-of-memory fix building esbuild entry points in batches of 10 and rendering 25 templates per `worker_threads` worker (6.1.5, 2026-05-18).
- **`ENOENT` from `email dev`:** ui@6.11.3 bumps `next` to 16.4.1 because Next 16.4 loads `server/preview-props.json`; older ui versions failed there.

Render, Tailwind and component changes are listed in their own files.

## Prove it

- `node --version` is 20.19 or later, and `package.json` has `react-email` in `dependencies` and `@react-email/ui` in `devDependencies`.
- No import from `@react-email/components` or `@react-email/preview-server` remains, and no `renderAsync` call.
- `email dev` starts on port 3000 and lists every template; shared folders start with `_` and don't appear.
- Every image path that starts with `/static/` is prefixed by a base URL that points at a real host in production.
- If `--esbuild-plugins` is used, `dev`, `build` and `export` all pass it.
