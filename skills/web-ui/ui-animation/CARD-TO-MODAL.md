# A card that opens a modal and owns the URL

A grid of cards morphs into a full-screen detail on the same page, and the URL follows, so Back closes it and a shared link works (RNDR Realm, "Building Smooth Page Transitions in React"). "Decouple your animations from your routing": keep both views mounted, change state to trigger the morph, update the URL yourself.

- **The card is a link** with a real `href`, since it navigates; the click handler takes only a plain click and lets Cmd or Ctrl-click open a new tab (the article checks only those two keys):

```tsx
const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
  if (!e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    onClick();
  }
};
```

- **Same `layoutId` on both:** the card is a `motion.a` and the detail sits in a `createPortal` full-screen overlay (`fixed inset-0 z-50`); "When one unmounts and the other mounts, Motion creates a smooth transition between them."

```tsx
<motion.a href={href} onClick={handleClick} layoutId={layoutId}
  style={{ background: color }} className="w-full aspect-[4/3] rounded-lg block" />
// detail:
<motion.div layoutId={selectedItem?.color} style={{ background: selectedItem?.color }}
  className="max-w-[600px] w-full aspect-[4/3] rounded-lg"
  transition={{ type: "spring", stiffness: 250, damping: 30 }} />
```

- **`pushState` for the URL, `popstate` back to state,** "because we want the animation to happen immediately without any page reload or navigation delay". Back then animates the detail closed; Forward reopens it:

```tsx
const handleClick = (data) => {
  setSelectedItem(data);                                              // trigger animation
  window.history.pushState({ id: data.id }, "", `/page-transition/${data.id}`);
};
const handleClose = () => {
  setSelectedItem(null);
  window.history.pushState({}, "", `/page-transition`);
};
useEffect(() => {
  const handlePopState = () => {
    if (window.location.pathname === "/page-transition") {
      setSelectedItem(null);
    } else {
      const slug = window.location.pathname.split("/page-transition/")[1];
      const parsed = parseInt(slug);
      const found = colors.find((color) => color.id === parsed);
      if (found) setSelectedItem(found);
    }
  };
  window.addEventListener("popstate", handlePopState);
  return () => window.removeEventListener("popstate", handlePopState);
}, []);
```

- **Closing, both ways:** the article pushes an entry on close too, so Back after open and close goes into the detail again; the `app-ui` skill's [app-ui OVERLAYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/OVERLAYS.md#a-settings-dialog) pushes on open and replaces on close, "so Back never reopens a closed dialog".
- **A real route for refresh and shared links,** rendering the same `Content`; an unknown id redirects to the list. Arriving there has no shared element, so no morph: "Animations work best for in-app transitions, not initial page loads."

```tsx
"use client";
import { colors, Content } from "../page";
import { redirect, useParams, useRouter } from "next/navigation";

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const selectedItem = colors.find((color) => color.id === Number(params.id));
  if (!selectedItem) {
    redirect("/page-transition");
  }
  return (
    <div className="h-screen w-full flex justify-center items-center">
      <Content selectedItem={selectedItem} handleGoBack={() => router.push("/page-transition")} />
    </div>
  );
}
```

- **The other cards yield:** they fade out at once, which "helps focus attention on the animating element", and on close wait for the morph, or "you'd see the cards pop back in while the element is still animating". Opacity gets its own sub-transition inside the spring:

```tsx
animate={{ opacity: isItemSelected ? 0 : 1 }}
transition={{
  type: "spring", stiffness: 250, damping: 30,
  opacity: { duration: 0.1, delay: isItemSelected ? 0 : 0.225 },
}}
```

- **When not to:** the approach "deliberately bypass[es] Next.js's routing system"; "If you need server-side rendering for every route change or rely heavily on Next.js's data fetching patterns, this might not be the right solution." The View Transitions route in [PATTERNS.md](PATTERNS.md#shared-elements-a-thumbnail-becomes-the-detail) is the alternative.
- The article's modal sends focus to its container and handles no Escape; the focus and dismiss rules in [PATTERNS.md](PATTERNS.md#modals-sheets-popovers) still apply.

## Prove it

Use the [modal focus and dismiss rules](PATTERNS.md#modals-sheets-popovers) and [shared motion review](SKILL.md#prove-it). Verify the real shared-link route and the Back/Forward behavior described above, keeping the article's push-on-close versus app-ui's replace-on-close disagreement visible. [RNDR Realm, Building Smooth Page Transitions in React]
