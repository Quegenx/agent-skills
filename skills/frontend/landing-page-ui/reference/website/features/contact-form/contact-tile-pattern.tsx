import { useReducedMotion } from "motion/react";
import { g as MotionG, path as MotionPath } from "motion/react-m";

import { contactFormStyles as styles } from "./contact-form.styles";

interface ContactTile {
  d: string;
  delayed?: boolean;
}

const contactTileGroups: ContactTile[][] = [
  [
    {
      d: "M485 368H399C381.327 368 367 382.327 367 400V486C367 503.673 381.327 518 399 518H485C502.673 518 517 503.673 517 486V400C517 382.327 502.673 368 485 368Z",
    },
  ],
  [
    {
      d: "M485 186H399C381.327 186 367 200.327 367 218V304C367 321.673 381.327 336 399 336H485C502.673 336 517 321.673 517 304V218C517 200.327 502.673 186 485 186Z",
      delayed: true,
    },
    {
      d: "M303 368H217C199.327 368 185 382.327 185 400V486C185 503.673 199.327 518 217 518H303C320.673 518 335 503.673 335 486V400C335 382.327 320.673 368 303 368Z",
      delayed: true,
    },
    {
      d: "M667 368H581C563.327 368 549 382.327 549 400V486C549 503.673 563.327 518 581 518H667C684.673 518 699 503.673 699 486V400C699 382.327 684.673 368 667 368Z",
      delayed: true,
    },
    {
      d: "M485 550H399C381.327 550 367 564.327 367 582V668C367 685.673 381.327 700 399 700H485C502.673 700 517 685.673 517 668V582C517 564.327 502.673 550 485 550Z",
      delayed: true,
    },
  ],
  [
    {
      d: "M303 186H217C199.327 186 185 200.327 185 218V304C185 321.673 199.327 336 217 336H303C320.673 336 335 321.673 335 304V218C335 200.327 320.673 186 303 186Z",
    },
    {
      d: "M485 4.5H399C381.327 4.5 367 18.8269 367 36.5V122.5C367 140.173 381.327 154.5 399 154.5H485C502.673 154.5 517 140.173 517 122.5V36.5C517 18.8269 502.673 4.5 485 4.5Z",
    },
    {
      d: "M121.3 368H35.3C17.6269 368 3.30005 382.327 3.30005 400V486C3.30005 503.673 17.6269 518 35.3 518H121.3C138.973 518 153.3 503.673 153.3 486V400C153.3 382.327 138.973 368 121.3 368Z",
    },
    {
      d: "M849 368H763C745.327 368 731 382.327 731 400V486C731 503.673 745.327 518 763 518H849C866.673 518 881 503.673 881 486V400C881 382.327 866.673 368 849 368Z",
    },
    {
      d: "M667 550H581C563.327 550 549 564.327 549 582V668C549 685.673 563.327 700 581 700H667C684.673 700 699 685.673 699 668V582C699 564.327 684.673 550 667 550Z",
    },
    {
      d: "M485 732H399C381.327 732 367 746.327 367 764V850C367 867.673 381.327 882 399 882H485C502.673 882 517 867.673 517 850V764C517 746.327 502.673 732 485 732Z",
    },
  ],
  [
    {
      d: "M303 4.59961H217C199.327 4.59961 185 18.9265 185 36.5996V122.6C185 140.273 199.327 154.6 217 154.6H303C320.673 154.6 335 140.273 335 122.6V36.5996C335 18.9265 320.673 4.59961 303 4.59961Z",
      delayed: true,
    },
    {
      d: "M121.69 186H35.6899C18.0168 186 3.68994 200.327 3.68994 218V304C3.68994 321.673 18.0168 336 35.6899 336H121.69C139.363 336 153.69 321.673 153.69 304V218C153.69 200.327 139.363 186 121.69 186Z",
      delayed: true,
    },
    {
      d: "M849 550H763C745.327 550 731 564.327 731 582V668C731 685.673 745.327 700 763 700H849C866.673 700 881 685.673 881 668V582C881 564.327 866.673 550 849 550Z",
      delayed: true,
    },
    {
      d: "M667 732H581C563.327 732 549 746.327 549 764V850C549 867.673 563.327 882 581 882H667C684.673 882 699 867.673 699 850V764C699 746.327 684.673 732 667 732Z",
      delayed: true,
    },
  ],
  [
    {
      d: "M118 1H32C14.3269 1 0 15.3269 0 33V119C0 136.673 14.3269 151 32 151H118C135.673 151 150 136.673 150 119V33C150 15.3269 135.673 1 118 1Z",
    },
    {
      d: "M845 737H759C741.327 737 727 751.327 727 769V855C727 872.673 741.327 887 759 887H845C862.673 887 877 872.673 877 855V769C877 751.327 862.673 737 845 737Z",
    },
  ],
];

const ContactTilePath = ({ d, delayed = false }: ContactTile) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      <MotionPath
        animate={
          prefersReducedMotion === true
            ? { opacity: 1 }
            : { opacity: [1, 0.33, 1] }
        }
        d={d}
        transition={
          prefersReducedMotion === true
            ? { duration: 0 }
            : {
                delay: delayed ? 1.5 : 0,
                duration: 3,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
              }
        }
        className={styles.graphicTileBase}
      />
      <path d={d} className={styles.graphicTileHover} />
    </>
  );
};

/**
 * Renders the contact background as individually hover-reactive SVG tiles.
 *
 * @returns The decorative tile pattern.
 */
export const ContactTilePattern = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className={styles.graphicPositioner}>
      <svg
        fill="none"
        height="888"
        viewBox="0 0 882 888"
        width="882"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.graphic}
      >
        <title>Contact Tile Graphic</title>
        {contactTileGroups.map((tiles, groupIndex) => (
          <MotionG
            animate={{ transform: "scale(1)" }}
            initial={
              prefersReducedMotion === true
                ? false
                : { transform: "scale(0)", transformOrigin: "center" }
            }
            key={tiles[0].d}
            transition={{
              bounce: 0.25,
              delay:
                prefersReducedMotion === true ? 0 : 0.25 + groupIndex * 0.05,
              duration: prefersReducedMotion === true ? 0 : 1,
              type: "spring",
            }}
            className={styles.graphicTileGroup}
          >
            {tiles.map((tile) => (
              <ContactTilePath key={tile.d} {...tile} />
            ))}
          </MotionG>
        ))}
      </svg>
    </div>
  );
};
