/** Shared typography and layout for support calls to action and guide copy. */
export const supportContentStyles = {
  card: "bg-background-panel rounded-xlarge p-18 max-[56.25rem]:p-8 max-[48rem]:p-6",
  container:
    "items-center gap-x-18 grid grid-cols-[minmax(0,1fr)_29.6875rem] max-[56.25rem]:grid-cols-1 max-w-246.5 gap-y-0 max-[56.25rem]:gap-y-10 w-full",
  content: "items-start flex flex-col gap-5",
  description: "text-foreground-secondary font-normal leading-[1.45]",
  directionalIcon:
    "rtl:[transform:scaleX(-1)] [transition:transform_200ms_ease]",
  directionalIconActive:
    "rtl:[transform:scaleX(-1)_translateX(0.09375rem)] [transform:translateX(0.09375rem)]",
  directionalIconExternalActive:
    "rtl:[transform:scaleX(-1)_translate(0.09375rem,-0.09375rem)] [transform:translate(0.09375rem,-0.09375rem)]",
  heading: "flex flex-col gap-4",
  iconCircle:
    "before:bg-[color-mix(in_srgb,currentColor_10%,transparent)] before:rounded-[50%] before:content-[''] before:h-5 before:inset-0 before:m-auto before:absolute before:[transition:transform_200ms_ease] before:w-5 items-center flex h-6 justify-center relative w-6",
  iconCircleActive: "before:[transform:scale(1.2)]",
  illustration:
    "rounded-xlarge h-62.5 max-[56.25rem]:h-55 overflow-hidden relative select-none w-full",
  illustrationImage: "block h-full object-contain pointer-events-none w-full",
  illustrationImageInset: "p-3",
  link: "items-center text-accent-link gap-x-2 flex font-medium leading-none no-underline",
  section: "px-12 max-[48rem]:px-6",
  title: "text-foreground-primary font-medium leading-[1.35]",
};
