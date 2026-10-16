export const siteHeaderStyles = {
  card: "bg-background-canvas rounded-medium text-foreground-strong flex flex-[1_1_0] flex-col gap-2 h-auto min-[64rem]:h-full min-w-0 overflow-hidden p-3 max-[39.9375rem]:p-2.5 relative",
  cardLink:
    "items-center self-start hover:bg-button-white-hover bg-brand-white border-border-subtle rounded-pill border-solid border text-button-text-on-white gap-x-2 cursor-pointer inline-flex min-h-9 py-2 px-3 no-underline [transition:background-color_200ms_ease]",
  cardLinkCurrent: "bg-accent text-button-text-on-brand",
  cardLinks: "flex flex-col gap-2 mt-1 relative",
  cards:
    "items-stretch min-[64rem]:items-end bottom-0 grid min-[64rem]:flex gap-2 min-[64rem]:gap-3 grid-cols-2 inset-x-0 overflow-y-auto [overscroll-behavior:contain] p-2 absolute top-17 max-[39.9375rem]:top-15",
  cardsHidden: "pointer-events-none invisible",
  cardsVisible: "pointer-events-auto visible",
  cardTitle: "text-foreground-strong m-0 relative",
  hamburger:
    "items-center self-center appearance-none bg-transparent border-0 text-foreground-strong cursor-pointer flex flex-col gap-1.5 h-11 justify-center min-w-11 p-0",
  hamburgerLine:
    "bg-current rounded-pill h-[2px] [transition:transform_200ms_ease] w-7.5 max-[39.9375rem]:w-6",
  hamburgerLineBottomOpen: "[transform:translateY(-0.25rem)_rotate(-45deg)]",
  hamburgerLineTopOpen: "[transform:translateY(0.25rem)_rotate(45deg)]",
  header: "inset-x-0 fixed top-0 z-1000",
  headerActions: "items-center flex gap-2",
  // Phones keep the sign-up button only; log-in is one tap away in the app.
  logInAction: "inline-flex max-[39.9375rem]:hidden",
  logo: "items-center self-center flex focus-visible:outline-focus outline-transparent outline-offset-[0.25rem] outline-solid outline-2",
  nav: "bg-background-menu rounded-large shadow-[0_12px_40px_var(--color-shadow-ambient)] overflow-hidden relative w-full",
  shell:
    "left-[50%] absolute top-10 max-[39.9375rem]:top-4 [transform:translateX(-50%)] [transition:width_300ms_cubic-bezier(0.23,1,0.32,1)] w-[calc(100%_-_4rem)] max-[39.9375rem]:w-[calc(100%_-_1.5rem)]",
  shellScrolled:
    "w-[calc(100%_-_4rem)] max-[39.9375rem]:w-[calc(100%_-_3rem)] min-[40rem]:max-[63.9375rem]:w-[calc(100%_-_7rem)]",
  skipLink:
    "bg-background-primary rounded-small shadow-[0_0_0_2px_var(--color-focus)] text-foreground-primary start-2 p-3 fixed no-underline focus-visible:top-2 top-[-100%] z-1000",
  topBar:
    "items-center flex h-17 max-[39.9375rem]:h-15 justify-between px-6 max-[39.9375rem]:px-4 relative z-2",
};
