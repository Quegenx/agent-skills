export const sideSectionNavigationStyles = {
  activeIndicator:
    "bg-foreground-primary rounded-medium h-5 start-[-0.09375rem] absolute top-[calc(50%_-_0.625rem)] w-[2px]",
  item: "cursor-pointer relative",
  label:
    "text-foreground-primary leading-[1.5] m-0 [transition:opacity_200ms_cubic-bezier(0.4,0,0.2,1)]",
  labelActive: "opacity-100",
  labelInactive: "opacity-50",
  link: "rounded-xsmall text-inherit block focus-visible:outline-focus outline-transparent outline-offset-[0.1875rem] outline-solid outline-2 ps-3 no-underline",
  list: "border-s-border-translucent [border-inline-start-style:solid] border-s flex flex-col gap-4 [list-style:none] m-0 p-0",
  navigation:
    "self-start block max-[48rem]:hidden shrink-0 h-fit max-w-75 sticky top-[calc(var(--spacing-anchor-scroll-offset)_+_1.5rem)] w-full",
};
