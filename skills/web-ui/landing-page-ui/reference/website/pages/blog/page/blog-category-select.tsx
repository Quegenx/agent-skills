import { useReducedMotion } from "motion/react";
import { useState } from "react";

import { blog_filter_label } from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";

import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import {
  SelectMenu,
  SelectMenuContent,
  SelectMenuIcon,
  SelectMenuItem,
  SelectMenuItemText,
  SelectMenuTrigger,
  SelectMenuValue,
} from "../../../shared/ui/select-menu/select-menu";
import type { BlogCategory } from "../data/posts";
import { blogCategories } from "../data/posts";
import { blogCategorySelectStyles as styles } from "./blog-category-select.styles";

interface BlogCategorySelectProps {
  onChange: (category: BlogCategory) => void;
  value: BlogCategory;
}

/**
 * The blog's category picker.
 *
 * @param props - value: the category shown; onChange: picks another.
 * @returns The picker.
 */
export const BlogCategorySelect = ({
  onChange,
  value,
}: BlogCategorySelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const selectedCategory = blogCategories.find(
    (category) => category.id === value
  );

  const direction = getLocale() === "he" ? "rtl" : "ltr";

  const _handleOnValueChange = (nextValue: string) => {
    const category = blogCategories.find((option) => option.id === nextValue);

    if (category) {
      onChange(category.id);
    }
  };

  return (
    <SelectMenu
      dir={direction}
      onOpenChange={setIsOpen}
      onValueChange={_handleOnValueChange}
      open={isOpen}
      value={value}
    >
      <SelectMenuTrigger
        aria-label={blog_filter_label()}
        className={styles.trigger}
      >
        <span className={styles.displayContainer}>
          <SelectMenuValue className={cn(typography.label, styles.label)}>
            {selectedCategory?.label()}
          </SelectMenuValue>
        </span>
        <SelectMenuIcon asChild>
          <span aria-hidden="true" className={styles.arrowContainer}>
            <svg
              fill="none"
              height="6"
              viewBox="0 0 10 6"
              width="10"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.arrow}
            >
              <title>Blog Category Select</title>
              <path
                d="M1 1L5 5L9 1"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="0.26"
                strokeWidth="2"
              />
            </svg>
          </span>
        </SelectMenuIcon>
      </SelectMenuTrigger>

      <SelectMenuContent
        contentClassName={[
          styles.content,
          prefersReducedMotion !== true &&
            (isOpen ? styles.contentEnter : styles.contentExit),
        ]}
        menuClassName={styles.menu}
      >
        {blogCategories.map((category) => (
          <SelectMenuItem
            isSelected={category.id === value}
            key={category.id}
            selectedClassName={styles.optionSelected}
            className={[typography.label, styles.option]}
            value={category.id}
          >
            <SelectMenuItemText>{category.label()}</SelectMenuItemText>
          </SelectMenuItem>
        ))}
      </SelectMenuContent>
    </SelectMenu>
  );
};
