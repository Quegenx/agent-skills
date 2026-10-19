import type { ClassValue } from "cn";
import type { ComponentProps } from "react";

import { cn } from "../styles/site-class-merge";
import type { ProductScreen } from "./product-screens";

type ProductScreenImageProps = Omit<
  ComponentProps<"img">,
  "className" | "height" | "src" | "style" | "width"
> & {
  screen: ProductScreen;
  // A list, so conditional classes (cond && className) combine as in cn.
  styles?: ClassValue[];
};

/**
 * A screen of the app at its own size; decorative unless alt describes it.
 *
 * @returns The image.
 */
export const ProductScreenImage = ({
  alt = "",
  screen,
  styles,
  ...image
}: ProductScreenImageProps) => (
  <img
    alt={alt}
    {...image}
    height={screen.height}
    src={screen.src}
    width={screen.width}
    className={cn(styles)}
  />
);
