import { useState } from "react";

/**
 * One open row at a time: a row's toggle opens it, or closes it when it is
 * the open one. -1 is no open row.
 *
 * @param itemCount - How many rows there are.
 * @returns The open row's index, its setter, and each row's toggle.
 */
export const useAccordionOpenItem = (itemCount: number) => {
  const [openIndex, setOpenIndex] = useState(-1);

  const handleItemToggles = Array.from(
    { length: itemCount },
    (_, index) => () => {
      setOpenIndex((current) => (current === index ? -1 : index));
    }
  );

  return { openIndex, setOpenIndex, handleItemToggles };
};
