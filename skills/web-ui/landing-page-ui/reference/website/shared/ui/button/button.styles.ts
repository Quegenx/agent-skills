export const buttons = {
  base: "items-center border-0 disabled:cursor-not-allowed cursor-pointer inline-flex gap-2 justify-center disabled:opacity-60 opacity-100 focus-visible:outline-focus outline-transparent outline-offset-2 outline-solid outline-2 disabled:pointer-events-none pointer-events-auto no-underline motion-safe:duration-150 duration-[0s] [transition-property:background-color,color] ease-[ease] whitespace-nowrap",
  large: "rounded-pill font-medium h-control-height-large px-6",
  pill: "rounded-pill h-control-height-medium px-4",
  small: "rounded-pill font-[450] h-control-height-small px-4",
  softAccent:
    "hover:[@media(hover:_hover)]:bg-accent-soft-hover bg-accent-soft text-accent-text",
  solidAccent:
    "hover:[@media(hover:_hover)]:bg-button-brand-hover bg-button-brand text-button-text-on-brand",
  solidInk:
    "hover:[@media(hover:_hover)]:bg-button-ink-hover bg-button-ink text-button-text-on-color",
  solidWhite:
    "hover:[@media(hover:_hover)]:bg-button-white-hover bg-brand-white text-button-text-on-white",
};
