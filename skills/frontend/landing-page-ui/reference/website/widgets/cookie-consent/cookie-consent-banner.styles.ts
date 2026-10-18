export const cookieConsentBannerStyles = {
  buttons:
    "items-center flex flex-row flex-wrap gap-3 justify-start max-[48rem]:justify-center w-auto max-[48rem]:w-full",
  container:
    "bg-background-primary rounded-large shadow-[0_8px_20px_var(--color-shadow-ambient),0_0_0_1px_var(--color-border-subtle)] mb-8 max-[48rem]:mb-2 me-8 max-[48rem]:me-auto ms-auto max-w-111 max-[48rem]:max-w-[95vw] p-5 max-[48rem]:p-3 pointer-events-auto w-auto max-[48rem]:w-full",
  content: "flex flex-col gap-5 max-[48rem]:gap-3 w-full",
  link: "rounded-xsmall hover:[@media(hover:_hover)]:text-foreground-primary text-foreground-secondary focus-visible:outline-focus outline-transparent outline-offset-2 outline-solid outline-2 hover:[@media(hover:_hover)]:decoration-foreground-primary decoration-border-secondary underline [transition:color_150ms,text-decoration-color_150ms]",
  overlay:
    "[align-items:normal] max-[48rem]:items-end bottom-0 block max-[48rem]:flex end-0 start-auto max-[48rem]:start-0 justify-normal max-[48rem]:justify-center p-4 max-[48rem]:p-2 pb-4 max-[48rem]:pb-[max(0.5rem,env(safe-area-inset-bottom,0rem))] pointer-events-none fixed z-1000",
  text: "text-foreground-primary leading-[1.5] m-0",
};
