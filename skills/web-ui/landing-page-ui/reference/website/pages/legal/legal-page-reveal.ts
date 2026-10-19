/**
 * Whether a legal page's sections reveal on scroll: when asked to, unless the
 * page has hydrated and the visitor prefers reduced motion. Before hydration
 * the server's markup stays, so hydration never removes its wrappers.
 *
 * @param revealSections - Whether the page asks its sections to reveal.
 * @param hydrated - Whether the page has hydrated.
 * @param prefersReducedMotion - The visitor's reduced-motion setting, null
 *   before it is known.
 * @returns Whether the sections reveal.
 */
export const legalPageRevealsSections = (
  revealSections: boolean,
  hydrated: boolean,
  prefersReducedMotion: boolean | null
) => revealSections && !(hydrated && prefersReducedMotion === true);
