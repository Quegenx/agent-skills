import { Cancel01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ClassValue } from "cn";
import { constVoid } from "effect/Function";
import {
  AnimatePresence,
  animate,
  LayoutGroup,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  button as MotionButton,
  dialog as MotionDialog,
  div as MotionDiv,
} from "motion/react-m";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { PointerEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";

import {
  blog_image_preview_close,
  blog_image_preview_dialog,
  blog_image_preview_open,
} from "#/paraglide/messages";

import { buttonPress } from "../../../shared/styles/button-press";
import { cn } from "../../../shared/styles/site-class-merge";
import { blogImagePreviewStyles as styles } from "./blog-image-preview.styles";

interface BlogImagePreviewProps {
  alt: string;
  fetchPriority?: "auto" | "high" | "low";
  height: number;
  imageClassName: ClassValue;
  loading?: "eager" | "lazy";
  src: string;
  triggerClassName: ClassValue;
  width: number;
}

const subscribeToClient = () => () => {
  // Client availability is stable after hydration.
};

const getClientSnapshot = (): boolean => true;
const getServerSnapshot = (): boolean => false;

const previewTransition = {
  duration: 0.25,
  ease: [0.23, 1, 0.32, 1],
} as const;

const dragReturnTransition = {
  bounce: 0.2,
  duration: 0.5,
  type: "spring",
} as const;

const handleCloseButtonPointerDown = (
  event: PointerEvent<HTMLButtonElement>
) => {
  event.stopPropagation();
};

/**
 * Opens a blog image in an accessible, draggable full-screen preview.
 *
 * @returns The image, and its preview dialog while open.
 */
export const BlogImagePreview = ({
  alt,
  fetchPriority,
  height,
  imageClassName,
  loading = "eager",
  src,
  triggerClassName,
  width,
}: BlogImagePreviewProps) => {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previewId = useId();

  const isClient = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot
  );

  const prefersReducedMotion = useReducedMotion();
  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);
  const rotateX = useTransform(motionY, [-300, 300], [2.5, -2.5]);
  const rotateZ = useTransform(motionX, [-300, 300], [-2.5, 2.5]);

  const closeHidden = {
    filter: prefersReducedMotion === true ? "blur(0px)" : "blur(4px)",
    opacity: 0,
  } as const;

  useEffect(() => {
    if (!open) {
      motionX.set(0);
      motionY.set(0);

      return constVoid;
    }

    const portal = portalRef.current;

    const inertElements = [...document.body.children].filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== portal
    );

    const previousInert = inertElements.map((element) => element.inert);
    const previousBodyOverflow = document.body.style.overflow;

    for (const element of inertElements) {
      element.inert = true;
    }

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousBodyOverflow;

      for (const [index, element] of inertElements.entries()) {
        element.inert = previousInert[index] ?? false;
      }
    };
  }, [motionX, motionY, open]);

  const _handleOnClick = () => {
    setOpen(false);
  };

  const _handleOnKeyDown = (event: ReactKeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      closeButtonRef.current?.focus();
    }
  };

  const _handleOnDragEnd = () => {
    animate(motionX, 0, dragReturnTransition);
    animate(motionY, 0, dragReturnTransition);
  };

  const _handleOnPointerDown = () => {
    setOpen(false);
  };

  const _handleOnExitComplete = () => triggerRef.current?.focus();

  const modal = (
    <div data-lenis-prevent="true" ref={portalRef} className={styles.portal}>
      <AnimatePresence initial={false} onExitComplete={_handleOnExitComplete}>
        {open ? (
          <MotionDiv
            animate={{
              opacity: 1,
            }}
            aria-hidden="true"
            exit={{
              opacity: 0,
            }}
            initial={{
              opacity: 0,
            }}
            key="blog-image-preview-backdrop"
            onPointerDown={_handleOnPointerDown}
            transition={previewTransition}
            className={styles.backdrop}
          />
        ) : null}
        {open ? (
          <MotionDialog
            animate="open"
            aria-label={blog_image_preview_dialog()}
            aria-modal="true"
            drag={prefersReducedMotion !== true}
            dragConstraints={{
              bottom: 90,
              left: -90,
              right: 90,
              top: -90,
            }}
            dragElastic={0.22}
            dragMomentum={false}
            exit="closed"
            initial="closed"
            key="blog-image-preview-dialog"
            layoutId={previewId}
            onDragEnd={_handleOnDragEnd}
            onKeyDown={_handleOnKeyDown}
            open
            style={{
              rotateX,
              rotateZ,
              x: motionX,
              y: motionY,
            }}
            transition={previewTransition}
            whileDrag={{
              scale: 1.01,
            }}
            className={styles.dialog}
          >
            <img
              alt={alt}
              draggable={false}
              height={height}
              src={src}
              width={width}
              className={styles.dialogImage}
            />
            <MotionButton
              aria-label={blog_image_preview_close()}
              {...buttonPress}
              onClick={_handleOnClick}
              onPointerDown={handleCloseButtonPointerDown}
              ref={closeButtonRef}
              transition={{
                duration: prefersReducedMotion === true ? 0.12 : 0.22,
                ease: "easeInOut",
              }}
              type="button"
              variants={{
                closed: closeHidden,
                open: {
                  filter: "blur(0px)",
                  opacity: 1,
                },
              }}
              className={styles.closeButton}
            >
              <span aria-hidden="true" className={styles.closeSurface}>
                <span className={styles.closeIcon}>
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={16}
                    strokeWidth={1.8}
                  />
                </span>
              </span>
            </MotionButton>
          </MotionDialog>
        ) : null}
      </AnimatePresence>
    </div>
  );

  const _handleOnClick2 = () => {
    setOpen(true);
  };

  return (
    <LayoutGroup id={`blog-image-${previewId}`}>
      <MotionButton
        aria-label={blog_image_preview_open()}
        layoutId={previewId}
        onClick={_handleOnClick2}
        ref={triggerRef}
        transition={previewTransition}
        type="button"
        className={cn(styles.trigger, triggerClassName)}
      >
        <img
          alt={alt}
          draggable={false}
          fetchPriority={fetchPriority}
          height={height}
          loading={loading}
          src={src}
          width={width}
          className={cn(imageClassName)}
        />
      </MotionButton>
      {isClient ? createPortal(modal, document.body) : null}
    </LayoutGroup>
  );
};
