// The weight of h3, h4 and strong text.
const mediumWeight = "font-medium";

export const blogPostProseStyles = {
  blockquote:
    "border-s-border-primary [border-inline-start-style:solid] border-s-2 text-foreground-tertiary italic my-[0_1.5rem] mx-0 ps-6",
  code: "bg-control-selected rounded-[0.375rem] text-foreground-secondary inline-block font-medium leading-[1.2] m-0 wrap-anywhere p-[0.1875rem_0.375rem] relative top-[-0.03125rem] align-middle",
  heading: "text-foreground-strong leading-[1.35]",
  headingFour: mediumWeight,
  headingThree: mediumWeight,
  headingTwo: "font-[450]",
  image: "block h-auto object-cover w-full",
  imageCaption: "text-foreground-tertiary leading-[1.45] mt-2.5 text-center",
  imageFigure: "m-[0_0_1.5rem]",
  imageTrigger: "rounded-medium block overflow-hidden w-full",
  list: "ps-0",
  listItem: "text-foreground-secondary leading-[1.5] ms-4 py-1",
  orderedList: "list-decimal ps-[0.1875rem]",
  strong: mediumWeight,
  table:
    "[border-collapse:collapse] rounded-small [border-spacing:0] shadow-[0_0_0_1px_var(--color-border-secondary)] table m-[0_auto] overflow-hidden w-full",
  tableBodyCell:
    "border-t-border-secondary [border-block-start-style:solid] border-t text-foreground-primary",
  tableCell:
    "last:shadow-none shadow-[inset_-1px_0_0_0_var(--color-border-secondary)] font-medium leading-[1.25rem] p-[0.5rem_1rem] text-start whitespace-break-spaces w-px",
  tableHead: "bg-background-panel text-foreground-primary text-start",
  tableWrapper:
    "block max-w-full overflow-x-auto p-[1px_1px_1.5rem] relative w-full",
  unorderedList: "list-disc",
};
