export const pricingPageStyles = {
  main: "min-w-0",
  plans: "items-stretch grid gap-6 grid-cols-3 max-[64rem]:grid-cols-1 w-full",
  // Each plan reveals on its own and still stretches to the row's height.
  planReveal: "flex",
  // The story-card surface (widgets/marketing-story/marketing-story.styles.ts).
  plan: "bg-background-panel rounded-[1.5rem] flex flex-col gap-6 p-8 max-[48rem]:p-6 text-start w-full",
  planHeader: "flex flex-col gap-2",
  nameRow: "items-center flex flex-wrap gap-2 justify-between",
  badge: "bg-accent-soft rounded-pill text-accent-text py-1 px-3",
  name: "text-foreground-strong m-0",
  audience: "text-foreground-product-secondary m-0 text-pretty",
  price: "items-baseline text-foreground-strong flex gap-2 m-0",
  priceAmount: "tabular-nums leading-none",
  pricePeriod: "text-foreground-product-secondary",
  features:
    "border-t-border-translucent [border-block-start-style:solid] border-t flex flex-col grow gap-3 [list-style:none] m-0 pt-6 px-0",
  feature: "items-start text-foreground-strong flex gap-2",
  featureIcon: "text-accent shrink-0 mt-0.5",
  action: "w-full",
  note: "text-foreground-product-secondary m-0 mt-8 text-center",
};
