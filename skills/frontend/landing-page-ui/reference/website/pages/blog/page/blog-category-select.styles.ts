export const blogCategorySelectStyles = {
  arrow: "text-current block",
  arrowContainer:
    "items-center bg-[var(--blog-category-background)] rounded-ee-[0.75rem] rounded-se-[0.75rem] text-foreground-secondary flex shrink-0 h-full justify-center duration-150 [transition-property:background-color] w-8",
  content:
    "outline-none origin-[var(--radix-select-content-transform-origin)] z-50",
  contentEnter:
    "[animation-duration:100ms] [animation-fill-mode:both] [animation-name:blog-category-select-enter] [animation-timing-function:ease]",
  contentExit:
    "[animation-duration:100ms] [animation-fill-mode:both] [animation-name:blog-category-select-exit] [animation-timing-function:ease]",
  displayContainer:
    "items-center bg-[var(--blog-category-background)] rounded-es-[0.75rem] rounded-ss-[0.75rem] gap-x-2 flex grow h-full px-4 duration-150 [transition-property:background-color]",
  label: "text-foreground-secondary font-[450] leading-[1.5] whitespace-nowrap",
  menu: "rounded-control gap-0.5 max-h-60 min-w-[var(--radix-popper-anchor-width)] overflow-y-auto",
  option:
    "rounded-small focus:text-foreground-primary text-foreground-secondary leading-[1.5] outline-none py-2 px-3 text-start duration-120 [transition-property:background-color,color] w-full",
  optionSelected: "bg-control-selected text-foreground-primary font-medium",
  trigger:
    "[--blog-category-background:var(--color-control-subtle)] items-center appearance-none bg-transparent border-0 text-inherit gap-x-1 cursor-pointer flex [font:inherit] h-8.5 m-0 min-w-32.5 focus-visible:outline-focus outline-transparent outline-offset-2 outline-solid outline-2 p-0 relative",
};
