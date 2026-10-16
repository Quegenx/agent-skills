// The body text of a card, a panel and the return panel.
const storyBodyText = "text-foreground-product-secondary m-0 text-pretty";

// The title of a card, a panel and the return panel.
const storyTitleText = "text-foreground-strong m-0";

export const marketingStoryStyles = {
  alternateSection: "bg-background-recessed-half",
  card: "bg-background-panel rounded-[1.5rem] flex flex-col overflow-hidden p-8 max-[48rem]:p-6",
  cardBody: storyBodyText,
  cardCopy: "flex flex-col gap-3 mt-6 text-start",
  cardImage:
    "block h-80 max-[48rem]:h-[clamp(11.25rem,calc(85.714vw_-_5.8929rem),15rem)] object-contain w-full",
  cardOnGray: "bg-background-product-card",
  cardReveal: "flex",
  cardTitle: storyTitleText,
  flowImage: "block h-auto max-h-110 object-contain w-full",
  flowPanel:
    "grid-cols-[minmax(0,1.4fr)_minmax(16.25rem,0.6fr)] max-[48rem]:grid-cols-[1fr]",
  option:
    "bg-background-product-card rounded-[62.4375rem] text-foreground-strong py-3 px-4",
  optionList: "flex flex-wrap gap-3 justify-center [list-style:none] m-0 p-0",
  optionsImage: "block h-auto max-h-115 object-contain w-full",
  optionsPanel: "items-center flex flex-col gap-8",
  panel:
    "items-center grid-cols-[minmax(0,1.2fr)_minmax(17.5rem,0.8fr)] max-[48rem]:grid-cols-[1fr] overflow-hidden",
  // The rounded panel a story panel and a flow panel sit on.
  panelSurface:
    "bg-background-panel rounded-[2rem] grid gap-8 max-[48rem]:gap-6 p-8 max-[48rem]:p-6",
  panelBody: storyBodyText,
  panelCopy: "flex flex-col gap-3 justify-center text-start",
  panelImage: "rounded-[1.5rem] block h-auto max-h-105 object-contain w-full",
  panelOnGray: "bg-background-product-card",
  panelReverse:
    "grid-cols-[minmax(17.5rem,0.8fr)_minmax(0,1.2fr)] max-[48rem]:grid-cols-[1fr]",
  panelTitle: storyTitleText,
  returnBody: storyBodyText,
  returnCopy: "flex flex-col gap-3 justify-center text-start",
  returnDivider: "my-[5rem_3.5rem] max-[48rem]:my-[3.5rem_2.5rem]",
  returnImage:
    "block h-64 max-[48rem]:h-[clamp(11.25rem,calc(114.286vw_-_11.6071rem),16rem)] object-contain w-full",
  returnPanel:
    "items-center bg-background-product-card rounded-[1.5rem] grid gap-8 grid-cols-[minmax(0,0.8fr)_minmax(17.5rem,1.2fr)] max-[48rem]:grid-cols-[1fr] p-8 max-[48rem]:p-6",
  returnTitle: storyTitleText,
  reversedCopy: "col-[1] max-[48rem]:col-[auto] row-[1] max-[48rem]:row-[auto]",
  reversedImage:
    "col-[2] max-[48rem]:col-[auto] row-[1] max-[48rem]:row-[auto]",
  step: "items-center grid gap-4 grid-cols-[2.5rem_1fr]",
  stepList: "flex flex-col gap-6 justify-center [list-style:none] m-0 p-0",
  stepNumber:
    "items-center bg-accent rounded-[50%] text-button-text-on-brand flex h-10 justify-center w-10",
  stepText: "text-foreground-strong",
  twoColumnGrid: "grid gap-6 grid-cols-2 max-[48rem]:grid-cols-[1fr] w-full",
};
