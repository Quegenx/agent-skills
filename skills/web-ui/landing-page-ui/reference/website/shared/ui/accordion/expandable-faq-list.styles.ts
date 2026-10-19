export const expandableFaqListStyles = {
  accordion: "pb-0",
  body: "-mt-4 -mx-4",
  content:
    "flex flex-col ms-auto [@container_faq-section_(max-width:_54.9375rem)]:ms-0 max-w-full min-w-0 w-157.5 [@container_faq-section_(max-width:_54.9375rem)]:w-full",
  resizing: "pointer-events-none",
  rowHidden: "hidden",
  showMore:
    "focus-visible:outline-[color:var(--faq-accent)] focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-2 bg-transparent rounded-[1rem] border-0 text-[var(--faq-accent)] cursor-pointer mb-2 mt-6 -ms-4 min-h-10 py-2.5 px-4 text-start w-fit",
  showMoreAccent: "[--faq-accent:var(--accordion-accent)]",
  showMorePurple: "[--faq-accent:var(--color-accent-text)]",
};
