import { PreviewCard } from "@base-ui/react/preview-card";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import type { MotionStyle, MotionValue } from "motion/react";
import { div as MotionDiv } from "motion/react-m";
import { useState } from "react";
import type { ReactElement, ReactNode } from "react";

import {
  app_chat_link_preview_alt,
  app_chat_link_preview_loading,
  app_chat_link_preview_unavailable,
} from "#/paraglide/messages";
import type { AgentChatLinkDetails } from "@/components/agent-chat/message/agent-chat-link-details";

// The preview's size: 200 by 125 px (agent-chat-markdown.css), its
// screenshot taken at three times that, as a phone sees the page.
const agentChatLinkPreviewWidth = 200;
const agentChatLinkPreviewHeight = 125;

// A live screenshot of the page (microlink.io, as the Amichai site's
// LinkPreview). It is requested only while a preview is open; the free tier
// allows about 50 screenshots a day, past which the card says the preview
// is unavailable.
const agentChatLinkPreviewImage = (url: string) =>
  `https://api.microlink.io/?${new URLSearchParams({
    colorScheme: "light",
    embed: "screenshot.url",
    meta: "false",
    screenshot: "true",
    url,
    "viewport.deviceScaleFactor": "1",
    "viewport.height": String(agentChatLinkPreviewHeight * 3),
    "viewport.isMobile": "true",
    "viewport.width": String(agentChatLinkPreviewWidth * 3),
  })}`;

/**
 * The Amichai site's LinkPreview (Aceternity's Link Preview), on Base UI's
 * PreviewCard and the chat's surfaces (agent-chat-markdown.css): hovering a
 * source chip opens, after 150ms, a card above it with the page's
 * screenshot and its domain. The card springs up from below (60% scale, 20px
 * down; stiffness 260, damping 20) and leans up to 12px toward the pointer
 * as it moves along the chip. Under reduced motion it only fades. The
 * trigger (render: a source chip's button, or a link in the answer's text)
 * keeps its own click. A link to something the agent found (details: a
 * listing's photo, title, price and place) shows that instead of a
 * screenshot, which for Facebook would be its login page.
 *
 * @returns The link and its preview card.
 */
export const AgentChatLinkPreview = ({
  url,
  host,
  render,
  children,
  onClick,
  details,
}: {
  url: string;
  host: string;
  render: ReactElement;
  children: ReactNode;
  onClick?: () => void;
  details?: AgentChatLinkDetails;
}) => {
  const [open, setOpen] = useState(false);

  const [imageState, setImageState] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  const reduce = useReducedMotion() === true;
  const pointerX = useMotionValue(0);
  const followX = useSpring(pointerX, { damping: 15, stiffness: 100 });
  const followTranslate = useTransform(followX, (value) => `${value}px`);

  // The lean toward the pointer, read by the card's translate
  // (agent-chat-markdown.css).
  const followStyle: MotionStyle & {
    "--preview-x": string | MotionValue<string>;
  } = { "--preview-x": reduce ? "0px" : followTranslate };

  const src = details ? details.imageUrl : agentChatLinkPreviewImage(url);
  const hidden = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 20 };

  return (
    <LazyMotion features={domAnimation} strict>
      <PreviewCard.Root
        open={open}
        onOpenChange={(next) => {
          if (next) {
            setImageState("loading");
            pointerX.set(0);
          }

          setOpen(next);
        }}
      >
        <PreviewCard.Trigger
          delay={150}
          closeDelay={100}
          render={render}
          onClick={onClick}
          onMouseMove={(event) => {
            if (reduce) {
              return;
            }

            const rect = event.currentTarget.getBoundingClientRect();
            pointerX.set(
              Math.max(
                -12,
                Math.min(12, (event.clientX - rect.left - rect.width / 2) / 2)
              )
            );
          }}
        >
          {children}
        </PreviewCard.Trigger>
        <AnimatePresence>
          {open && (
            <PreviewCard.Portal keepMounted>
              <PreviewCard.Positioner
                side="top"
                align="center"
                sideOffset={10}
                collisionPadding={24}
                className="agent-chat-link-preview-positioner"
              >
                <PreviewCard.Popup
                  render={
                    <MotionDiv
                      className="agent-chat-link-preview"
                      initial={hidden}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={hidden}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { damping: 20, stiffness: 260, type: "spring" }
                      }
                    />
                  }
                >
                  <MotionDiv
                    className="agent-chat-link-preview-card"
                    style={followStyle}
                  >
                    {src !== null && (
                      <div className="agent-chat-link-preview-image">
                        {imageState !== "ready" && (
                          <span className="agent-chat-link-preview-placeholder">
                            {imageState === "error"
                              ? app_chat_link_preview_unavailable()
                              : app_chat_link_preview_loading()}
                          </span>
                        )}
                        {imageState !== "error" && (
                          <img
                            key={src}
                            src={src}
                            width={agentChatLinkPreviewWidth}
                            height={agentChatLinkPreviewHeight}
                            alt={app_chat_link_preview_alt({ host })}
                            referrerPolicy="no-referrer"
                            decoding="async"
                            data-ready={imageState === "ready"}
                            onLoad={() => {
                              setImageState("ready");
                            }}
                            onError={() => {
                              setImageState("error");
                            }}
                          />
                        )}
                      </div>
                    )}
                    {details ? (
                      <span className="agent-chat-link-preview-found">
                        <bdi className="agent-chat-link-preview-title">
                          {details.title}
                        </bdi>
                        {details.detail !== null && (
                          <bdi className="agent-chat-link-preview-detail">
                            {details.detail}
                          </bdi>
                        )}
                      </span>
                    ) : (
                      <bdi dir="ltr" className="agent-chat-link-preview-host">
                        {host}
                      </bdi>
                    )}
                  </MotionDiv>
                </PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          )}
        </AnimatePresence>
      </PreviewCard.Root>
    </LazyMotion>
  );
};
