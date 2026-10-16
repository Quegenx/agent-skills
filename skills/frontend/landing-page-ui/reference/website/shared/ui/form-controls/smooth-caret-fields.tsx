import { span as MotionSpan } from "motion/react-m";
import type { RefObject } from "react";
import { useRef } from "react";

import { cn } from "../../styles/site-class-merge";
import { smoothCaretFieldStyles as styles } from "./smooth-caret-field.styles";
import type { SmoothCaretFieldProps } from "./smooth-caret-lifecycle";
import {
  useSmoothCaretField,
  useSmoothCaretMotion,
} from "./smooth-caret-lifecycle";
import { scheduleSmoothCaretUpdate } from "./smooth-caret-position";
import { scheduleSmoothTextareaCaretUpdate } from "./smooth-caret-textarea-position";

type SmoothCaretInputProps = SmoothCaretFieldProps<"input"> & {
  inputRef: RefObject<HTMLInputElement | null>;
};

/**
 * Keeps the native input behavior while springing its visual caret between positions.
 *
 * @returns The input with its smooth caret.
 */
export const SmoothCaretInput = ({
  inputRef,
  onBlur,
  onChange,
  onFocus,
  onKeyUp,
  onPointerUp,
  onScroll,
  onSelect,
  trailingControl,
  value,
  wrapperClassName,
  ...inputProps
}: SmoothCaretInputProps) => {
  const supportsSelection = inputProps.type !== "email";
  const renderedInputMode = supportsSelection ? inputProps.inputMode : "email";
  const renderedType = supportsSelection ? inputProps.type : "text";
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const { caretOpacity, caretX, inputCaretTransform, visualCaretX } =
    useSmoothCaretMotion();

  const caretHandlers = useSmoothCaretField({
    caretOpacity,
    containerRef,
    disabled: inputProps.disabled,
    elementRef: inputRef,
    onBlur,
    onChange,
    onFocus,
    onKeyUp,
    onPointerUp,
    onScroll,
    onSelect,
    place: (input, animationFrameRef) => {
      scheduleSmoothCaretUpdate({
        animationFrameRef,
        caretOpacity,
        caretX,
        input,
        measure: measureRef.current,
        visualCaretX,
      });
    },
  });

  return (
    <div
      className={wrapperClassName}
      data-smooth-caret="input"
      ref={containerRef}
    >
      <input
        {...inputProps}
        {...caretHandlers}
        inputMode={renderedInputMode}
        ref={inputRef}
        type={renderedType}
        value={value}
      />
      <span aria-hidden="true" ref={measureRef} className={styles.measure} />
      <MotionSpan
        aria-hidden="true"
        style={{ opacity: caretOpacity, transform: inputCaretTransform }}
        className={styles.caret}
      />
      {trailingControl}
    </div>
  );
};

type SmoothCaretTextareaProps = SmoothCaretFieldProps<"textarea"> & {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

/**
 * Keeps native textarea behavior while springing its visual caret across wrapped lines.
 *
 * @returns The textarea with its smooth caret.
 */
export const SmoothCaretTextarea = ({
  onBlur,
  onChange,
  onFocus,
  onKeyUp,
  onPointerUp,
  onScroll,
  onSelect,
  textareaRef,
  trailingControl,
  value,
  wrapperClassName,
  ...textareaProps
}: SmoothCaretTextareaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);

  const {
    caretOpacity,
    caretX,
    caretY,
    textareaCaretTransform,
    visualCaretX,
    visualCaretY,
  } = useSmoothCaretMotion();

  const caretHandlers = useSmoothCaretField({
    caretOpacity,
    containerRef,
    disabled: textareaProps.disabled,
    elementRef: textareaRef,
    onBlur,
    onChange,
    onFocus,
    onKeyUp,
    onPointerUp,
    onScroll,
    onSelect,
    place: (textarea, animationFrameRef) => {
      scheduleSmoothTextareaCaretUpdate({
        animationFrameRef,
        caretOpacity,
        caretX,
        caretY,
        marker: markerRef.current,
        mirror: mirrorRef.current,
        textarea,
        visualCaretX,
        visualCaretY,
      });
    },
  });

  return (
    <div
      className={wrapperClassName}
      data-smooth-caret="textarea"
      ref={containerRef}
    >
      <textarea
        {...textareaProps}
        {...caretHandlers}
        ref={textareaRef}
        value={value}
      />
      <div
        aria-hidden="true"
        ref={mirrorRef}
        className={cn(styles.measure, styles.measureMultiline)}
      >
        <span ref={markerRef} />
      </div>
      <MotionSpan
        aria-hidden="true"
        style={{ opacity: caretOpacity, transform: textareaCaretTransform }}
        className={cn(styles.caret, styles.caretMultiline)}
      />
      {trailingControl}
    </div>
  );
};
