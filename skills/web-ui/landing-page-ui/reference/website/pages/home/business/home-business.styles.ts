// Muted copy on the section's dark panel.
const mutedOnDarkText = "text-brand-white-muted";

export const homeBusinessStyles = {
  card: "bg-[image:linear-gradient(180deg,rgba(15,15,16,0.85),rgba(27,27,28,0.85)),linear-gradient(193deg,#1B1B1C_13.08%,#0866FF_100%)]",
  cards:
    "grid gap-6 max-[64rem]:gap-10 grid-cols-3 max-[64rem]:grid-cols-1 relative w-full",
  description: mutedOnDarkText,
  illustration:
    "pb-18 max-[48rem]:pb-12 pt-20 max-[48rem]:pt-12 relative w-full",
  illustrationFrame:
    "aspect-[1173/904] rounded-[1.0625rem] max-[48rem]:rounded-control [mask-image:linear-gradient(180deg,black_0%,black_50%,transparent_100%)] overflow-hidden relative",
  illustrationObject: "block h-full pointer-events-none w-full",
  product: mutedOnDarkText,
  productIcon: "block",
  section: "pt-30 max-[48rem]:pt-section-block-wide",
  sectionDescription: mutedOnDarkText,
  sectionHeadingWrap: "items-center flex flex-row justify-between w-full",
  sectionTitle: "text-brand-white",
  softWhiteButton:
    "hover:[@media(hover:_hover)]:bg-brand-white-hover bg-brand-white-subtle text-brand-white",
  subsection: "mb-14",
  title: "text-product-title",
  titleHighlight: "text-accent",
};
