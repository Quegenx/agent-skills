/** Shared height-transition shell for expandable FAQ lists. */
export const accordionListResizerStyles = {
  clip: "overflow-hidden",
  inner: "min-h-0",
  resizer:
    "flex flex-col overflow-visible relative [transition-property:height] ease-[cubic-bezier(0.19,1,0.22,1)] w-full",
};
