export const homePersonalCarouselStyles = {
  arrowButton:
    "items-center [&:hover:not(:disabled)]:[@media(hover:_hover)]:bg-background-glass-hover bg-background-glass rounded-[50%] border-0 text-foreground-tertiary disabled:cursor-default cursor-pointer flex h-10 max-[48rem]:h-11 justify-center disabled:opacity-50 opacity-100 p-0 [transition:opacity_0.2s_ease,background-color_0.2s_ease] w-10 max-[48rem]:w-11",
  cardReveal:
    "flex-[0_0_22.8125rem] max-[48rem]:flex-[0_0_82%] max-w-[22.8125rem] max-[48rem]:max-w-[82%] [scroll-snap-align:start]",
  carousel:
    "items-end flex flex-col gap-[1.4375rem] pt-0 max-[48rem]:pt-6 w-full",
  chevronNext:
    "rtl:[transform:scaleX(-1)_translateX(1px)] [transform:translateX(1px)]",
  chevronPrevious:
    "rtl:[transform:translateX(1px)] [transform:scaleX(-1)_translateX(1px)]",
  controls: "items-center flex gap-2",
  headingColumn:
    "flex-[1_1] max-w-136 max-[48rem]:max-w-none min-w-0 pe-4 max-[48rem]:pe-0 max-[48rem]:w-full",
  section: "box-border max-w-full min-w-0 p-0 relative w-full",
  sectionDescription: "text-foreground-secondary",
  sectionHeading: "[mix-blend-mode:var(--theme-product-blend-mode)]",
  sectionTitle: "text-foreground-primary",
  softButton:
    "hover:[@media(hover:_hover)]:bg-border-translucent bg-border-subtle text-foreground-strong shrink-0",
  subsection:
    "gap-8 max-[48rem]:gap-7.5 [mix-blend-mode:var(--theme-product-blend-mode)]",
  track:
    "[--fade-left:0] [--fade-right:0] [--fade-w-left:3rem] max-[48rem]:[--fade-w-left:1rem] [--fade-w-right:6rem] max-[48rem]:[--fade-w-right:0.75rem] [direction:inherit] flex flex-row gap-4 [mask-image:linear-gradient(to_right,rgba(0,0,0,calc(1_-_var(--fade-left)))_0,#000_var(--fade-w-left),#000_calc(100%_-_var(--fade-w-right)),rgba(0,0,0,calc(1_-_var(--fade-right)))_100%)] [-ms-overflow-style:none] overflow-x-auto p-px [scrollbar-width:none] [scroll-padding-inline-start:1px] [scroll-snap-type:x_proximity] [-webkit-overflow-scrolling:touch] w-full",
  trackRtl:
    "[mask-image:linear-gradient(to_right,rgba(0,0,0,calc(1_-_var(--fade-right)))_0,#000_var(--fade-w-left),#000_calc(100%_-_var(--fade-w-right)),rgba(0,0,0,calc(1_-_var(--fade-left)))_100%)]",
};
