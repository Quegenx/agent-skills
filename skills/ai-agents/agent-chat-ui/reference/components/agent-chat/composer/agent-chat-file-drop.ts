import { constVoid } from "effect/Function";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/**
 * Dropping files anywhere on the composer (agent-chat-composer.tsx) attaches
 * them; dragging is true while files are held over it. The listeners go on
 * the form element, reading the latest addFiles through a ref.
 *
 * @param formRef - The composer's form.
 * @param addFiles - Attaches the dropped files.
 * @returns Whether files are being dragged over the composer.
 */
export const useAgentChatFileDrop = (
  formRef: RefObject<HTMLFormElement | null>,
  addFiles: (files: FileList | null) => void
) => {
  const [dragging, setDragging] = useState(false);
  const addFilesRef = useRef(addFiles);
  useLayoutEffect(() => {
    addFilesRef.current = addFiles;
  });
  useEffect(() => {
    const form = formRef.current;

    if (!form) {
      return constVoid;
    }

    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes("Files") === true) {
        event.preventDefault();
        setDragging(true);
      }
    };

    const onDragLeave = (event: DragEvent) => {
      if (
        !(event.relatedTarget instanceof Node) ||
        !form.contains(event.relatedTarget)
      ) {
        setDragging(false);
      }
    };

    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      setDragging(false);
      addFilesRef.current(event.dataTransfer?.files ?? null);
    };

    form.addEventListener("dragover", onDragOver);
    form.addEventListener("dragleave", onDragLeave);
    form.addEventListener("drop", onDrop);

    return () => {
      form.removeEventListener("dragover", onDragOver);
      form.removeEventListener("dragleave", onDragLeave);
      form.removeEventListener("drop", onDrop);
    };
  }, [formRef]);

  return dragging;
};
