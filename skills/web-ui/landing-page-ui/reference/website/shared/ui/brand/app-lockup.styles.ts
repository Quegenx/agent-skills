export const appLockupStyles = {
  lockup: "items-center inline-flex gap-2",
  mark: "block shrink-0 h-[var(--app-logo-size)] w-[var(--app-logo-size)]",
  wordmark:
    "text-foreground-primary font-marketing text-[calc(var(--app-logo-size)_*_0.62)] font-[650] tracking-[-0.02em] leading-none whitespace-nowrap",
  wordmarkOnDark: "text-brand-white",
  // The header's sign-up button needs the room on the narrowest phones.
  wordmarkHiddenOnPhone: "max-[26rem]:hidden",
  small: "[--app-logo-size:1.75rem]",
  large: "[--app-logo-size:2.25rem]",
};
