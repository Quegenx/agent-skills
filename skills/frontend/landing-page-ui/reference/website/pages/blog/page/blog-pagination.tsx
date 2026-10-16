import type { MouseEvent } from "react";

import {
  blog_pagination_label,
  blog_pagination_next,
  blog_pagination_page,
  blog_pagination_previous,
} from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";

import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import { blogPaginationStyles as styles } from "./blog-pagination.styles";

interface BlogPaginationProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
}

// The previous or next page button; its arrow flips in Hebrew.
const PaginationArrow = ({
  arrow,
  disabled,
  label,
  onClick,
}: {
  arrow: "←" | "→";
  disabled: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    type="button"
    className={cn(typography.label, styles.arrowButton)}
  >
    <span
      aria-hidden="true"
      className={cn(
        styles.arrowIcon,
        getLocale() === "he" && styles.arrowIconRtl
      )}
    >
      {arrow}
    </span>
  </button>
);

/**
 * The blog's page numbers with previous and next; nothing for a single page.
 *
 * @param props - currentPage; totalPages; onPageChange: moves to a page.
 * @returns The pagination, or null.
 */
export const BlogPagination = ({
  currentPage,
  onPageChange,
  totalPages,
}: BlogPaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    onPageChange(currentPage + 1);
  };

  const handlePageClick = (event: MouseEvent<HTMLButtonElement>) => {
    onPageChange(Number(event.currentTarget.value));
  };

  return (
    <nav aria-label={blog_pagination_label()} className={styles.panel}>
      <PaginationArrow
        arrow="←"
        disabled={currentPage === 1}
        label={blog_pagination_previous()}
        onClick={handlePrevious}
      />
      <div className={styles.pages}>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (page) => (
            <button
              aria-current={page === currentPage ? "page" : undefined}
              aria-label={blog_pagination_page({ page })}
              key={page}
              onClick={handlePageClick}
              type="button"
              value={page}
              className={cn(
                typography.label,
                styles.pageButton,
                page === currentPage && styles.pageButtonActive
              )}
            >
              {page}
            </button>
          )
        )}
      </div>
      <PaginationArrow
        arrow="→"
        disabled={currentPage === totalPages}
        label={blog_pagination_next()}
        onClick={handleNext}
      />
    </nav>
  );
};
