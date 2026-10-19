export const helpSearchStyles = {
  content: "grid max-[48rem]:block grid-cols-[14.6875rem_1fr]",
  dialogLayer:
    "bg-transparent border-0 h-dvh inset-0 m-0 max-w-none p-0 pointer-events-none fixed w-full z-9999999",
  empty:
    "items-center flex flex-col gap-6 justify-center min-h-60 p-[4rem_2rem]",
  emptyList: "col-span-full min-h-60",
  emptyText: "text-foreground-faint font-medium leading-[1.2] text-center",
  group: "pb-2.5",
  groupHeading:
    "text-foreground-muted rtl:tracking-normal tracking-[0.1px] leading-[1.2] p-3",
  groupItems: "border-0 m-0 min-w-0 p-0",
  input:
    "placeholder:text-foreground-faint placeholder:[-webkit-text-fill-color:var(--color-foreground-faint)] appearance-none bg-transparent border-b-border-primary [border-block-end-style:solid] border-b [border-inline:0] [border-top:0] caret-foreground-secondary text-foreground-secondary font-normal rtl:tracking-normal tracking-[0.1px] leading-[1.2] outline-none py-5 pe-12 ps-3 [-webkit-text-fill-color:var(--color-foreground-secondary)] w-full",
  item: "items-center data-[selected=true]:bg-control-subtle bg-transparent rounded-small text-foreground-primary gap-x-2 cursor-pointer flex leading-[1.2] p-[0.375rem_0.75rem] no-underline [transition:background-color_0.15s_ease]",
  itemShortcut:
    "bg-background-primary rounded-[0.34375rem] text-foreground-slate font-medium rtl:tracking-normal tracking-[-0.078px] leading-[normal] ms-auto p-[0.125rem_0.75rem]",
  itemTitle: "overflow-hidden text-ellipsis whitespace-nowrap",
  list: "max-h-92 overflow-auto [overscroll-behavior:contain] pe-2 [-webkit-overflow-scrolling:touch]",
  overlay:
    "[animation-duration:0.2s] [animation-name:help-search-scrim-enter] [animation-timing-function:ease] bg-overlay-scrim h-dvh inset-0 opacity-100 fixed [transition:opacity_0.2s_ease] w-full z-9999998",
  overlayClosed: "opacity-0",
  preview:
    "before:bg-[image:linear-gradient(transparent,var(--color-background-primary))] before:bottom-0 before:content-[''] before:h-16 before:inset-x-0 before:absolute before:w-full border-s-border-primary [border-inline-start-style:solid] border-s block max-[48rem]:hidden max-h-92 overflow-y-auto [overscroll-behavior:contain] p-[1.625rem_1rem_1.625rem_1.625rem] relative [-webkit-overflow-scrolling:touch]",
  previewDescription:
    "text-foreground-secondary font-normal leading-[1.5] mt-4",
  previewDetails:
    "text-foreground-secondary flex flex-col gap-2 leading-[1.5] mt-4 ps-6",
  previewHeader:
    "items-baseline text-foreground-faint flex font-medium justify-between leading-[1.5]",
  previewTag:
    "data-[category=account]:border-accent data-[category=bookings]:border-accent-heading data-[category=business]:border-accent data-[category=gallery]:border-accent data-[category=login-security]:border-accent data-[category=payments]:border-accent data-[category=products]:border-accent data-[category=schedule-hours]:border-accent border-border-subtle rounded-[3.125rem] border-solid border data-[category=account]:text-accent data-[category=bookings]:text-accent-heading data-[category=business]:text-accent data-[category=gallery]:text-accent data-[category=login-security]:text-accent data-[category=payments]:text-accent data-[category=products]:text-accent data-[category=schedule-hours]:text-accent text-foreground-secondary font-medium rtl:tracking-normal tracking-[-0.09px] leading-[normal] p-[0.375rem_0.75rem] capitalize",
  previewTitle:
    "text-foreground-primary block font-medium leading-[1.5] mt-4 no-underline",
  root: "[animation-duration:0.2s] [animation-name:help-search-root-enter] [animation-timing-function:ease] bg-background-primary rounded-medium shadow-[0_2px_18px_var(--color-shadow-ambient),0_0_0_1px_var(--color-border-subtle)] inset-x-0 m-[0.5rem_auto] max-w-[39.8125rem] opacity-100 overflow-hidden p-[0_0.625rem] pointer-events-auto absolute top-[20%] [transform:scale(1)_translateY(0)] [transition:transform_0.2s_ease,opacity_0.2s_ease] w-[96%]",
  rootClosed:
    "opacity-0 pointer-events-none [transform:scale(0.9)_translateY(1.25rem)]",
};
