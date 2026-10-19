export const contactFormStyles = {
  description:
    "text-foreground-secondary font-normal leading-[1.5] m-0 max-w-128 text-center",
  error:
    "text-foreground-tertiary font-normal inset-x-0 leading-[1.25rem] m-0 pointer-events-none absolute text-end top-[100%]",
  field: "flex flex-col gap-1.5 relative w-full",
  fieldHeader: "items-center flex justify-between px-2",
  form: "items-start bg-background-primary border-border-subtle rounded-xlarge border-solid border flex flex-col gap-9 max-w-157 p-12 max-[37.5rem]:p-6 relative w-full z-2",
  formReveal: "max-w-157 relative w-full z-2",
  formStage: "flex justify-center relative w-full",
  graphic:
    "block h-222 [transform:rotate(-47deg)_scale(1.5)_skew(10deg,15deg)] w-220.5",
  graphicPositioner:
    "left-[50%] absolute top-[50%] [transform:translate(-50%,-50%)] z-1",
  graphicTileBase: "fill-background-recessed pointer-events-none",
  graphicTileGroup: "[transform-box:fill-box] origin-[center]",
  graphicTileHover:
    "fill-accent-soft-hover hover:opacity-100 opacity-0 pointer-events-none [@media(hover:_hover)_and_(pointer:_fine)]:pointer-events-auto [transition:opacity_200ms_cubic-bezier(0.77,0,0.175,1)]",
  input:
    "bg-control-subtle border-transparent rounded-control border-solid border-0 focus:shadow-[inset_0_0_0_2px_var(--color-focus)] shadow-[inset_0_0_0_1px_transparent] placeholder:text-foreground-placeholder text-foreground-primary font-normal leading-[1.5rem] outline-none p-[0.625rem_1rem] [transition:box-shadow_200ms_ease] w-full",
  inputMuted:
    "bg-control-selected focus:shadow-none shadow-none cursor-default opacity-64 pointer-events-none",
  inputVanishing: "text-transparent",
  inputWrap: "relative w-full",
  label:
    "items-center text-foreground-secondary inline-flex font-normal gap-[0.3125rem] leading-[1.5]",
  main: "overflow-hidden relative",
  required: "bg-accent rounded-pill shrink-0 h-1.5 w-1.5",
  section: "min-h-svh overflow-hidden relative",
  sectionLayout:
    "items-center flex flex-col gap-10 justify-center relative w-full z-2",
  status:
    "[clip:rect(0,0,0,0)] [clip-path:inset(50%)] h-px overflow-hidden absolute whitespace-nowrap w-px",
  submit:
    "flex font-medium leading-[1.5] mt-2 min-h-11 p-[0.5rem_1.5rem] [transition:background-color_300ms_cubic-bezier(0.22,1,0.36,1)] w-full",
  submitIcon: "h-4.5 w-4.5",
  submitIconSlot: "start-0 absolute top-0 w-4.5",
  submitIconWrap:
    "items-center flex shrink-0 h-4.5 justify-center overflow-hidden relative",
  submitResultGroup: "flex flex-col gap-6 w-full",
  successBody: "text-foreground-secondary font-normal leading-[1.5] m-0",
  successCard: "bg-background-recessed rounded-large flex flex-col gap-3 p-6",
  successTitle: "text-foreground-strong font-[450] m-0",
  successWrap: "overflow-hidden",
  textarea: "min-h-35 resize-none",
};
