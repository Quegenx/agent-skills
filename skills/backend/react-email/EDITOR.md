# React Email visual editor

The embeddable `@react-email/editor` API from the React Email vendor skill and its editor reference; the original source qualifiers and examples are retained below. Template patterns and internationalization are in [PATTERNS.md](PATTERNS.md).

## The visual editor

[resend/react-email, editor reference]

`@react-email/editor` is an embeddable visual email editor built on TipTap and ProseMirror that produces email-ready HTML: rich text, bubble menus, slash commands, multi-column layouts, email theming, HTML export and custom extensions. Version 1.0.0 launched April 16, 2026. It is not included in `react-email`.

- **Install** `npm install @react-email/editor`. It needs React 18+ and a bundler that supports package exports (Vite, Next.js, Webpack 5 and similar).
- **Styles:** `import '@react-email/editor/themes/default.css';` loads the default color theme and the UI styles for bubble menus, slash commands and the inspector. Granular files: `@react-email/editor/styles/bubble-menu.css`, `@react-email/editor/styles/slash-command.css`, `@react-email/editor/styles/inspector.css`.
- **Entry points:**

  | Import | Purpose |
  |---|---|
  | `@react-email/editor` | `EmailEditor`, all in one |
  | `@react-email/editor/core` | `composeReactEmail`, `EmailNode`, `EmailMark`, event bus, types |
  | `@react-email/editor/extensions` | `StarterKit` and 35+ email-aware extensions |
  | `@react-email/editor/ui` | `BubbleMenu`, `SlashCommand`, `Inspector` |
  | `@react-email/editor/plugins` | `EmailTheming` |
  | `@react-email/editor/utils` | Attribute helpers, style utilities |

### All in one: `EmailEditor`

[resend/react-email, editor reference]

`EmailEditor` bundles StarterKit, EmailTheming, bubble menus and slash commands.

```tsx
import { EmailEditor, type EmailEditorRef } from '@react-email/editor';
import '@react-email/editor/themes/default.css';
import { useRef } from 'react';

export function MyEditor() {
  const editorRef = useRef<EmailEditorRef>(null);

  const handleExport = async () => {
    const { html, text } = await editorRef.current!.export();
    console.log(html, text);
  };

  return (
    <div>
      <EmailEditor
        ref={editorRef}
        content="<p>Start typing...</p>"
        theme="basic"
        onReady={(editor) => console.log('Editor ready', editor)}
        onChange={(editor) => console.log('Content changed')}
      />
      <button onClick={handleExport}>Export HTML</button>
    </div>
  );
}
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `content` | `Content` | | HTML string or TipTap JSON |
| `onChange` | `(editor: Editor) => void` | | Every change |
| `onUploadImage` | `UploadImageHandler` | | Pasted or dropped images |
| `onReady` | `(editor: Editor) => void` | | Called when the editor is initialized |
| `theme` | `'basic' \| 'minimal'` | `'basic'` | |
| `editable` | `boolean` | `true` | |
| `placeholder` | `string` | | |
| `bubbleMenu` | `{ hideWhenActiveNodes?: string[], hideWhenActiveMarks?: string[] }` | | |
| `extensions` | `Extensions` | | Replaces the defaults entirely |
| `className` | `string` | | CSS class for the editor container |

`EmailEditorRef`: `export()` returns `Promise<{ html: string; text: string }>`; `getJSON()` returns `JSONContent`; `getHTML()` returns `string`; `editor` is `Editor | null`.

### Composing your own

[resend/react-email, editor reference]

- **Minimal:** `EditorProvider` from `@tiptap/react` with `extensions = [StarterKit]` and TipTap JSON content (`{ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '...' }] }] }`). It gives the core extensions (paragraphs, headings, lists, tables, code blocks, columns, buttons and more) and no UI overlays.
- **Bubble menus** (children of `EditorProvider`): `BubbleMenu` on text selection (bold, italic, underline, strike, code, uppercase, alignment, node type, link); `BubbleMenu.LinkDefault` (edit URL, open, unlink); `BubbleMenu.ButtonDefault` (edit button URL, unlink); `BubbleMenu.ImageDefault` (edit image URL). Remove items with `<BubbleMenu excludeItems={['strike', 'code', 'uppercase']} />`. When combining it with the contextual menus, set `hideWhenActiveMarks` on `BubbleMenu` so it doesn't appear while a link is focused.
- **Slash commands** (typing `/`): `import { defaultSlashCommands, SlashCommand } from '@react-email/editor/ui';` then `<SlashCommand items={defaultSlashCommands} />`. Defaults: TEXT, H1, H2, H3, BULLET_LIST, NUMBERED_LIST, QUOTE, CODE (Text) and BUTTON, DIVIDER, SECTION, TWO_COLUMNS, THREE_COLUMNS, FOUR_COLUMNS (Layout). Cherry-pick with `import { BUTTON, H1, H2, TEXT } from '@react-email/editor/ui';` and `<SlashCommand items={[TEXT, H1, H2, BUTTON]} />`.
- **Inspector:** a contextual sidebar for document styles, node properties and text formatting that switches with the selection. It requires `EmailTheming`.
  ```tsx
  import { StarterKit } from '@react-email/editor/extensions';
  import { EmailTheming } from '@react-email/editor/plugins';
  import { Inspector } from '@react-email/editor/ui';
  import { EditorContent, EditorContext, useEditor } from '@tiptap/react';
  import '@react-email/editor/themes/default.css';

  const extensions = [StarterKit, EmailTheming];

  export function MyEditor() {
    const editor = useEditor({ extensions, content });

    return (
      <EditorContext.Provider value={{ editor }}>
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1 }}>
            <EditorContent editor={editor} />
          </div>
          <Inspector.Root style={{ width: 240, borderLeft: '1px solid #e5e7eb', padding: 16 }}>
            <Inspector.Breadcrumb />
            <Inspector.Document />
            <Inspector.Node />
            <Inspector.Text />
          </Inspector.Root>
        </div>
      </EditorContext.Provider>
    );
  }
  ```
- **EmailTheming:** themes are resolved during `composeReactEmail` and inlined as `style` attributes. `EmailTheming.configure({ theme: 'basic' })`; `'basic'` is full styling (the default), `'minimal'` essentially none. To switch at runtime, re-key the provider: `<EditorProvider key={theme} ...>`. The skill says the themes have customizable CSS properties, but its editor reference doesn't show how.

### Exporting

[resend/react-email, editor reference]

- **`composeReactEmail`** is the lower-level export. `preview` is optional and sets the inbox preview text.
  ```tsx
  import { composeReactEmail } from '@react-email/editor/core';
  import { useCurrentEditor } from '@tiptap/react';

  function ExportPanel() {
    const { editor } = useCurrentEditor();

    const handleExport = async () => {
      if (!editor) return;
      const { html, text } = await composeReactEmail({
        editor,
        preview: 'Inbox preview text', // optional
      });
      console.log(html, text);
    };

    return <button onClick={handleExport}>Export HTML</button>;
  }
  ```
- **The pipeline:** read the JSON document, traverse nodes and marks, call `renderToReactEmail()` on each `EmailNode` and `EmailMark`, apply EmailTheming styles if configured, then wrap in the base template and render HTML plus plain text.

### Custom nodes and marks

[resend/react-email, editor reference]

`EmailNode.create` extends TipTap's `Node` with `renderToReactEmail()`. Inline marks use `EmailMark` from `@react-email/editor/core` the same way.

```tsx
import { EmailNode } from '@react-email/editor/core';
import { mergeAttributes } from '@tiptap/core';

const Callout = EmailNode.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',

  parseHTML() {
    return [{ tag: 'div[data-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-callout': '',
        style: 'padding: 12px 16px; background: #f4f4f5; border-left: 3px solid #1c1c1c;',
      }),
      0,
    ];
  },

  renderToReactEmail({ children, style }) {
    return (
      <div style={{ ...style, padding: '12px 16px', backgroundColor: '#f4f4f5', borderLeft: '3px solid #1c1c1c' }}>
        {children}
      </div>
    );
  },
});

// Register it
const extensions = [StarterKit, Callout];
```

### Editor limits

[resend/react-email, editor reference]

- **Slow Next.js dev compilation:** `CodeBlock` ships every Prism grammar. The escape hatch is patching `dist/components/code-block/prism.mjs`.
- **`CodeBlock` throws** when given a language that isn't registered.

## Prove it

[resend/react-email, editor reference]

- The editor's `export()` or `composeReactEmail` returns both `html` and `text`, and switching the theme re-keys the provider.
