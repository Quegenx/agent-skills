export const blogImagePreviewStyles = {
  backdrop:
    "[backdrop-filter:blur(0.75rem)] bg-overlay-dim inset-0 pointer-events-auto fixed",
  closeButton:
    "items-center bg-transparent rounded-pill border-0 text-button-text-on-color cursor-pointer flex h-10 end-3 justify-center focus-visible:outline-focus outline-transparent outline-offset-2 outline-solid outline-2 p-0 absolute top-3 w-10 z-2",
  closeIcon: "block h-4 w-4",
  closeSurface:
    "items-center hover:bg-foreground-secondary bg-foreground-tertiary rounded-pill flex h-8 justify-center [transition:background-color_180ms_ease] w-8",
  dialog:
    "bg-transparent rounded-medium border-0 shadow-[0_24px_80px_var(--color-shadow-deep)] cursor-grab inset-0 m-auto max-h-[calc(100dvh_-_1.5rem)] max-w-[min(68.75rem,94vw)] overflow-hidden p-0 pointer-events-auto fixed touch-none",
  dialogImage:
    "bg-background-recessed block h-auto max-h-[calc(100dvh_-_1.5rem)] max-w-[min(68.75rem,94vw)] object-contain select-none w-auto",
  portal:
    "inset-0 [overscroll-behavior:contain] pointer-events-none fixed z-1000",
  trigger: "bg-transparent border-0 cursor-pointer p-0 relative",
};
