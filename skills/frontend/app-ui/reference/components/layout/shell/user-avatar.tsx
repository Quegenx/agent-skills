import multiavatar from "@multiavatar/multiavatar/esm";
import { useMemo } from "react";

/**
 * A user's own cartoon avatar, drawn by Multiavatar from their user id: the
 * same face on every device and load, so nothing is stored, and it stays
 * when they change their name or email. Decorative beside their name.
 *
 * @returns The avatar image.
 */
export const UserAvatar = ({
  userId,
  className,
}: {
  userId: string;
  className?: string;
}) => {
  const src = useMemo(
    () => `data:image/svg+xml;utf8,${encodeURIComponent(multiavatar(userId))}`,
    [userId]
  );

  return <img src={src} alt="" className={className} />;
};
