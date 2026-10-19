export const helpTopicCardStyles = {
  arrow:
    "items-center bg-background-primary border-border-subtle rounded-pill border-solid border text-accent-text flex max-[48rem]:hidden h-10 end-4 justify-center opacity-0 absolute top-4 rtl:[transform:translateX(0.25rem)_rotate(180deg)] [transform:translateX(-0.25rem)] [transition:opacity_0.2s_ease,transform_0.2s_ease] w-10",
  arrowActive: "opacity-100 rtl:[transform:rotate(180deg)] transform-none",
  card: "hover:[--help-topic-icon-color:var(--color-accent)] [--help-topic-icon-color:var(--color-foreground-tertiary)] items-center [backdrop-filter:blur(0.25rem)] hover:bg-background-elevated bg-background-panel rounded-large hover:shadow-[0_1px_2px_var(--color-shadow-ambient)] shadow-none flex flex-row gap-[0.9375rem] max-[48rem]:gap-3 h-full min-w-0 p-6 max-[48rem]:p-5 relative no-underline [transition:background-color_0.2s_ease,box-shadow_0.2s_ease] w-full",
  content: "flex flex-[1_0] flex-col gap-2 min-w-0 w-full",
  description:
    "overflow-hidden text-ellipsis whitespace-nowrap max-[48rem]:whitespace-normal",
  illustration: "items-center flex h-17.5 justify-center w-17.5",
  illustrationContainer:
    "items-center flex shrink-0 h-12.5 justify-center w-12.5",
  title: "text-foreground-strong whitespace-nowrap",
};
