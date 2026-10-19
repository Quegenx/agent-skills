import { g as MotionG } from "motion/react-m";

/**
 * The 404 character's head, shared by the website's NotFoundIllustration
 * and the app's AppNotFoundIllustration: its eyes blink and look side to
 * side every few seconds (question marks bob above it:
 * not-found-character-motion.ts). The head and its eyes, inside the caller's <svg> (viewBox 0 0 324 324, or
 * a crop of it). Still when animated is false (reduced motion).
 *
 * @returns The head's SVG shapes.
 */
export const NotFoundHeadDrawing = ({
  animated,
  eyeDuration,
}: {
  animated: boolean;
  eyeDuration: number;
}) => (
  <>
    <MotionG
      animate={
        animated
          ? {
              scaleY: [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1],
              x: [0, 15, 15, -15, -15, -15, 0],
            }
          : undefined
      }
      transition={{
        delay: 1,
        duration: eyeDuration,
        ease: [0.75, 0, 0.35, 1],
        repeat: Number.POSITIVE_INFINITY,
        repeatDelay: 4,
      }}
    >
      <path
        d="M136.87 201.97C148.54 200.07 156.46 189.08 154.57 177.41C152.68 165.74 141.68 157.82 130.01 159.71C118.34 161.61 110.42 172.6 112.31 184.27C114.21 195.94 125.2 203.86 136.87 201.97Z"
        fill="currentColor"
      />
      <path
        d="M192.82 201.97C204.49 200.07 212.41 189.08 210.52 177.41C208.63 165.74 197.63 157.82 185.96 159.71C174.29 161.61 166.37 172.6 168.26 184.27C170.16 195.94 181.15 203.86 192.82 201.97Z"
        fill="currentColor"
      />
    </MotionG>
    <path
      d="M161.38 92.48C103.26 92.48 56.14 140.5 56.15 199.71H83.03C83.03 155.33 117.83 119.35 161.38 119.35C204.92 119.35 239.72 155.33 239.72 199.71H266.6C266.61 140.5 219.49 92.48 161.38 92.48Z"
      fill="currentColor"
    />
  </>
);
