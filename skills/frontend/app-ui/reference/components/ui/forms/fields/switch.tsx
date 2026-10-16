import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "cn";
import { useRef } from "react";

// Flutter's Material 3 thumb on a toggle (switch.dart, thumbSizeAnimation),
// as tor-app's switch draws it, scaled to our 44×24 track: over 300ms the
// thumb stretches into a 25.5×16.5 pill in the first 11%, settles to its end
// size by 83% and holds. Going off plays the same steps toward the dot. The
// slide itself is CSS (switch.css).
const switchThumbDot = { inlineSize: "0.75rem", blockSize: "0.75rem" };
const switchThumbOn = { inlineSize: "1.125rem", blockSize: "1.125rem" };

const switchThumbStretch = {
  inlineSize: "1.59375rem",
  blockSize: "1.03125rem",
};

const playSwitchThumbStretch = (thumb: HTMLElement, checked: boolean) => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const [from, to] = checked
    ? [switchThumbDot, switchThumbOn]
    : [switchThumbOn, switchThumbDot];

  thumb.animate(
    [
      { ...from, offset: 0, easing: "cubic-bezier(0.31, 0, 0.56, 1)" },
      {
        ...switchThumbStretch,
        offset: 0.11,
        easing: "cubic-bezier(0.2, 0, 0, 1)",
      },
      { ...to, offset: 0.83 },
      { ...to, offset: 1 },
    ],
    { duration: 300 }
  );
};

const Switch = ({
  className,
  onCheckedChange,
  ...props
}: Omit<SwitchPrimitive.Root.Props, "children">) => {
  const thumbRef = useRef<HTMLSpanElement>(null);

  return (
    <SwitchPrimitive.Root
      render={<button type="button" aria-label={props["aria-label"]} />}
      nativeButton
      data-slot="switch"
      className={cn("app-switch", className)}
      onCheckedChange={(checked, details) => {
        if (thumbRef.current) {
          playSwitchThumbStretch(thumbRef.current, checked);
        }

        onCheckedChange?.(checked, details);
      }}
      {...props}
    >
      <span className="app-switch-track" aria-hidden="true">
        <span className="app-switch-surface">
          <SwitchPrimitive.Thumb
            ref={thumbRef}
            data-slot="switch-thumb"
            className="app-switch-thumb"
          />
        </span>
      </span>
    </SwitchPrimitive.Root>
  );
};

export { Switch };
