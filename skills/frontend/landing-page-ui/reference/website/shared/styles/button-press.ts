/** Shared press feedback for buttons and button-like links. */
export const buttonPressCss = `
:is(
  button,
  a[href],
  [role="button"],
  input[type="button"],
  input[type="submit"],
  input[type="reset"],
  [data-button-press]
) {
  --button-bg: var(--primary);
  --button-bg-hover: color-mix(in oklch, var(--primary), var(--background) 14%);
  --button-fg: var(--primary-foreground);
  --button-focus: var(--ring);
  transform: translateZ(0);
  transform-origin: 50% 50%;
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease,
    color 140ms ease,
    transform 120ms ease;
}

@media (hover: hover) {
  :is(
    button,
    a[href],
    [role="button"],
    input[type="button"],
    input[type="submit"],
    input[type="reset"],
    [data-button-press]
  ):not(:disabled):not([aria-disabled="true"]):not([data-disabled="true"]):hover {
    transform: scaleX(1.012) scaleY(1.012);
  }
}

:is(
  button,
  a[href],
  [role="button"],
  input[type="button"],
  input[type="submit"],
  input[type="reset"],
  [data-button-press]
):not(:disabled):not([aria-disabled="true"]):not([data-disabled="true"]):active {
  transform: scaleX(1.07) scaleY(0.91);
  transition-duration: 70ms;
}

@media (prefers-reduced-motion: reduce) {
  :is(
    button,
    a[href],
    [role="button"],
    input[type="button"],
    input[type="submit"],
    input[type="reset"],
    [data-button-press]
  ) {
    animation: none !important;
    transform: none !important;
    transition:
      background-color 140ms ease,
      border-color 140ms ease,
      box-shadow 140ms ease,
      color 140ms ease;
  }
}
`;

export const buttonPress = { "data-button-press": "" } as const;
