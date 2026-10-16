import { RegistryContext } from "@effect/atom-react";
import type { CodeHighlighterPlugin } from "@streamdown/code";
import { cn } from "cn";
import { Effect } from "effect";
import { use, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Streamdown, defaultRehypePlugins } from "streamdown";
import type { ExtraProps, StreamdownProps } from "streamdown";

import {
  app_cancel,
  app_chat_link_leads_to,
  app_chat_open_link_title,
  app_open,
} from "#/paraglide/messages";
import {
  AgentChatLinkDetailsContext,
  agentChatLinkKey,
} from "@/components/agent-chat/message/agent-chat-link-details";
import { AgentChatLinkPreview } from "@/components/agent-chat/message/agent-chat-link-preview";
import { useAgentChatSmoothText } from "@/components/agent-chat/message/agent-chat-smooth-text";
import { agentChatFaviconUrl } from "@/components/agent-chat/work/agent-chat-answer-work";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/feedback/dialog/alert-dialog";
import { AppIcon } from "@/components/ui/general/app-icon";
import { runClientEffect } from "@/lib/atoms/app-atom-runtime";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

// The agent's answers can quote what the system read on Facebook, so their
// links and images are hardened past Streamdown's defaults (rehype-harden):
// no inline data images, links and images only over http(s) (harden matches
// prefixes per origin, so "*" is how any host is allowed), plus mailto and
// tel. javascript:, data:, file: and vbscript: are always blocked, and a
// blocked link or image shows as its text. Sanitizing stays as shipped.
// Streamdown ships harden as a [plugin, options] pair; the plugin is reused
// with these options in place of its permissive defaults.
type AgentChatRehypePlugin = NonNullable<
  StreamdownProps["rehypePlugins"]
>[number];

const agentChatHardenOptions = {
  allowedLinkPrefixes: ["*"],
  allowedImagePrefixes: ["*"],
  allowedProtocols: ["tel:"],
  allowDataImages: false,
  linkBlockPolicy: "text-only",
  imageBlockPolicy: "text-only",
};

const agentChatHarden: AgentChatRehypePlugin = Array.isArray(
  defaultRehypePlugins.harden
)
  ? [defaultRehypePlugins.harden[0], agentChatHardenOptions]
  : defaultRehypePlugins.harden;

// Each text block takes its direction from its first letter, the HTML
// dir="auto" rule every RTL product follows, so a Hebrew sentence with an
// English name or a URL in it stays right-to-left. Streamdown's own
// dir="auto" counts letters instead, and a Hebrew line ending in a long
// Facebook URL turned left-to-right. Runs after sanitizing, which keeps dir.
// A hast property value (hast's PropertyValue).
type AgentChatHastProperty =
  | string
  | number
  | boolean
  | readonly (string | number)[]
  | null
  | undefined;

interface AgentChatHastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, AgentChatHastProperty>;
  children?: AgentChatHastNode[];
}

const agentChatTextBlocks = new Set([
  "p",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "td",
  "th",
]);

const markAgentChatTextDirection = (node: AgentChatHastNode) => {
  if (isNonEmptyText(node.tagName) && agentChatTextBlocks.has(node.tagName)) {
    node.properties = { ...node.properties, dir: "auto" };
  }

  for (const child of node.children ?? []) {
    markAgentChatTextDirection(child);
  }
};

const agentChatFirstLetterDirection = () => markAgentChatTextDirection;

const agentChatRehypePlugins: AgentChatRehypePlugin[] = [
  defaultRehypePlugins.raw,
  defaultRehypePlugins.sanitize,
  agentChatHarden,
  agentChatFirstLetterDirection,
];

// Code blocks are highlighted by Shiki (@streamdown/code). It is about
// 190 KB, so it loads the first time a message has a code fence, not with
// the app; until then that code shows plain. Each language loads the first
// time it appears. The app is light only, so both of Streamdown's theme
// slots are GitHub's light theme.
type AgentChatCodePlugins = NonNullable<StreamdownProps["plugins"]>;

let agentChatCodePlugins: AgentChatCodePlugins | null = null;
let agentChatCodePluginsLoading: Promise<AgentChatCodePlugins> | null = null;

const readAgentChatCodePlugins = async () => {
  const { createCodePlugin } = await import("@streamdown/code");

  const code: CodeHighlighterPlugin = createCodePlugin({
    themes: ["github-light", "github-light"],
  });

  agentChatCodePlugins = { code };

  return agentChatCodePlugins;
};

const loadAgentChatCodePlugins = async () => {
  agentChatCodePluginsLoading ??= readAgentChatCodePlugins();

  return await agentChatCodePluginsLoading;
};

const markdownCodeFence = /^ {0,3}(?:```|~~~)/mu;

const useAgentChatCodePlugins = (markdown: string) => {
  const registry = useContext(RegistryContext);
  const hasCode = markdownCodeFence.test(markdown);
  const [plugins, setPlugins] = useState(agentChatCodePlugins);
  useEffect(() => {
    if (!hasCode || plugins) {
      return;
    }

    void runClientEffect(
      registry,
      Effect.tryPromise(loadAgentChatCodePlugins).pipe(
        Effect.match({
          onSuccess: setPlugins,
          // The code stays plain; the next code block tries the download
          // again.
          onFailure: () => {
            agentChatCodePluginsLoading = null;
          },
        })
      )
    );
  }, [hasCode, plugins, registry]);

  return plugins ?? undefined;
};

// Links to Facebook, where the agent's groups, posts and people are, open at
// once. Any other site first shows its full address, so a link written into
// a post the agent quotes cannot pass itself off as something else.
const agentChatTrustedLinkHosts = ["facebook.com", "fb.com", "fb.me"];

const isAgentChatTrustedLink = (url: string) => {
  if (!URL.canParse(url)) {
    return false;
  }

  const { protocol, hostname } = new URL(url);

  return (
    protocol === "https:" &&
    agentChatTrustedLinkHosts.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    )
  );
};

const AgentChatLinkConfirm = ({
  url,
  isOpen,
  onClose,
  onConfirm,
}: {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => (
  <AlertDialog
    open={isOpen}
    onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}
  >
    <AlertDialogContent title={app_chat_open_link_title()}>
      <AlertDialogDescription>
        {app_chat_link_leads_to()}
        <bdi dir="ltr" className="break-all">
          {url}
        </bdi>
      </AlertDialogDescription>
      <AlertDialogFooter>
        <AlertDialogCancel>{app_cancel()}</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>{app_open()}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// A site's address without its scheme and "www.", as its source chip names
// it ("wolt.com").
const agentChatSourceHost = (url: string) =>
  new URL(url).hostname.replace(/^www\./u, "");

/**
 * A source chip: the site's favicon and domain in the chat's chip style
 * (agent-chat-markdown.css). Hovering it previews the page
 * (AgentChatLinkPreview); it opens only after the confirm above shows its
 * full address.
 *
 * @returns The chip, its preview, and the dialog that confirms leaving for the
 *   site.
 */
export const AgentChatSourceChip = ({ url }: { url: string }) => {
  const [confirming, setConfirming] = useState(false);
  const host = agentChatSourceHost(url);

  return (
    <>
      <AgentChatLinkPreview
        url={url}
        host={host}
        render={
          <button
            type="button"
            className="agent-chat-source"
            aria-label={host}
          />
        }
        onClick={() => {
          setConfirming(true);
        }}
      >
        <img src={agentChatFaviconUrl(url)} alt="" width={14} height={14} />
        <bdi dir="ltr">{host}</bdi>
      </AgentChatLinkPreview>
      <AgentChatLinkConfirm
        url={url}
        isOpen={confirming}
        onClose={() => {
          setConfirming(false);
        }}
        onConfirm={() => {
          window.open(url, "_blank", "noreferrer");
          setConfirming(false);
        }}
      />
    </>
  );
};

// A link to a site the chat trusts (Facebook, the listing sites): it opens
// at once, looks as the cards' links do, and previews on hover what it
// leads to, with the found item's own photo and price when the agent found
// it (AgentChatLinkDetailsContext).
const AgentChatTextLink = ({
  href,
  text,
  children,
}: {
  href: string;
  // The link's words, its name for assistive technology (the rendered
  // children may be animation spans).
  text: string;
  children?: ReactNode;
}) => {
  const details = use(AgentChatLinkDetailsContext).get(agentChatLinkKey(href));

  return (
    <AgentChatLinkPreview
      url={href}
      host={agentChatSourceHost(href)}
      details={details}
      render={
        <a
          data-streamdown="link"
          className="agent-chat-text-link"
          href={href}
          target="_blank"
          rel="noreferrer"
          // Words inside formatting (bold) leave text empty: the link then
          // keeps the name its content gives it.
          aria-label={text || undefined}
        />
      }
    >
      <span className="agent-chat-text-link-label">{children}</span>
      <AppIcon icon="agent-arrow-up-right" />
    </AgentChatLinkPreview>
  );
};

// The answer's links (Streamdown's components.a). A link to another site
// shows its words, then its source chip. A Facebook link stays a link and
// opens at once. While its address is still streaming in (Streamdown's
// streamdown:incomplete-link), a link shows as its words. Link text that is
// itself the address is not repeated before the chip.
const AgentChatLink = ({
  href,
  children,
  node,
}: {
  href?: string;
  children?: ReactNode;
} & ExtraProps) => {
  if (!isNonEmptyText(href) || href === "streamdown:incomplete-link") {
    return <span>{children}</span>;
  }

  const external =
    URL.canParse(href) &&
    ["http:", "https:"].includes(new URL(href).protocol) &&
    !isAgentChatTrustedLink(href);

  // The link's own words, from its syntax node (the rendered children may
  // be animation spans).
  const text = (node?.children ?? [])
    .map((child) => (child.type === "text" ? child.value : ""))
    .join("");

  if (!external) {
    return (
      <AgentChatTextLink href={href} text={text}>
        {children}
      </AgentChatTextLink>
    );
  }

  const host = agentChatSourceHost(href);

  const textIsAddress = text === href || text.includes(host);

  return (
    <>
      {!textIsAddress && children}
      <AgentChatSourceChip url={href} />
    </>
  );
};

// SAFETY: Streamdown renders components.a with an anchor's props (href and
// children, its Components type's declared `a`); only its index signature,
// typed for unknown custom tags, is wider than AgentChatLink's props.
const agentChatComponents = {
  a: AgentChatLink,
} as NonNullable<StreamdownProps["components"]>;

// While an answer is revealed, each new character fades in out of a light
// blur over 450ms on a soft ease-out (sd-agentChatReveal,
// agent-chat-markdown.css). The characters already come out at a steady
// pace (useAgentChatSmoothText), so they need no stagger: the fades overlap
// into one soft trailing edge. Per character rather than per word, so the
// edge moves smoothly instead of a word at a time. Finished text has no
// animation; off under reduced motion.
const agentChatTextReveal: NonNullable<StreamdownProps["animated"]> = {
  animation: "agentChatReveal",
  duration: 450,
  easing: "cubic-bezier(0.23, 1, 0.32, 1)",
  sep: "char",
  stagger: 0,
};

/**
 * The agent's markdown, rendered by Streamdown as AI Elements'
 * MessageResponse is. While it streams (streaming), the text comes out at a
 * steady pace (useAgentChatSmoothText), and Streamdown splits it into
 * blocks it memoizes and completes unfinished syntax, so a half-written
 * **bold** or link never shows as raw characters; an unfinished link shows as
 * its text until its address arrives. Finished text renders once, statically.
 * Each text block takes its own direction from its first letter
 * (agentChatFirstLetterDirection), so English lines stay left-to-right.
 * Code blocks and tables have copy and download buttons; code has no line numbers, since the
 * agent only quotes short snippets. Links to other sites are source chips
 * that open in a new tab after the confirm above (AgentChatLink); Facebook
 * links open at once. The look comes from .agent-chat-markdown (agent-chat-markdown.css).
 *
 * @returns The rendered markdown.
 */
export const AgentChatMarkdown = ({
  children,
  streaming = false,
  className,
}: {
  children: string;
  streaming?: boolean;
  className?: string;
}) => {
  const codePlugins = useAgentChatCodePlugins(children);
  const shown = useAgentChatSmoothText(children, streaming);

  return (
    <Streamdown
      mode={shown.revealing ? "streaming" : "static"}
      isAnimating={shown.revealing}
      animated={agentChatTextReveal}
      remend={{ linkMode: "text-only" }}
      rehypePlugins={agentChatRehypePlugins}
      controls={{ code: true, table: true, mermaid: false }}
      lineNumbers={false}
      plugins={codePlugins}
      components={agentChatComponents}
      className={cn("agent-chat-markdown", className)}
    >
      {shown.text}
    </Streamdown>
  );
};
