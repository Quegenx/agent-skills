import { getRouteApi, useNavigate } from "@tanstack/react-router";

import {
  app_close,
  app_notification_unread,
  app_notifications,
  app_notifications_empty_description,
  app_notifications_empty_title,
  app_notifications_mark_all_read,
  app_notifications_unread_label,
} from "#/paraglide/messages";
import { EmptyState } from "@/components/ui/display/empty";
import { TooltipHint } from "@/components/ui/display/tooltip";
import { Button } from "@/components/ui/general/button";
import { AppIcon } from "@/components/ui/general/app-icon";
import { SmoothDropdown } from "@/components/ui/navigation/dropdown/smooth-dropdown";
import { formatTimeAgo } from "@/lib/dates/relative-time";
import {
  useUserNotifications,
  useUserNotificationsRead,
} from "@/lib/notifications/user-notification-atoms";

const appRouteApi = getRouteApi("/app/_app");

// The panel's width: 24rem, as a phone allows (SmoothDropdown keeps it
// inside the screen).
const appNotificationsPanelWidth = 384;

/**
 * The header's bell: the task monitor's notifications (a new opportunity, a
 * task whose scan failed) with an unread count. The bell's own surface grows
 * into the panel, as every dropdown here does (SmoothDropdown), and shrinks
 * back into it. A notification opens what it is about, is marked read and
 * closes the panel; "סימון הכול כנקרא" marks the rest.
 *
 * @returns The bell and its notifications panel.
 */
export const AppNotifications = () => {
  const { user } = appRouteApi.useRouteContext();
  const navigate = useNavigate();
  const { notifications, unread, loading } = useUserNotifications(user.id);
  const markRead = useUserNotificationsRead(user.id);

  return (
    <SmoothDropdown
      label={
        unread > 0
          ? app_notifications_unread_label({ count: unread })
          : app_notifications()
      }
      appearance="round"
      backdrop
      panelWidth={appNotificationsPanelWidth}
      renderPanel={(close) => (
        <div className="app-notifications-panel">
          <div className="app-notifications-head">
            <h2 className="app-notifications-title">{app_notifications()}</h2>
            <div className="app-notifications-actions">
              {/* Stays mounted when everything is read, so keyboard focus
                  on it is not lost. */}
              {notifications.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={unread === 0}
                  onClick={() => {
                    markRead(null);
                  }}
                >
                  {app_notifications_mark_all_read()}
                </Button>
              )}
              {/* Gray at rest, as every close ×. */}
              <TooltipHint label={app_close()}>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  aria-label={app_close()}
                  onClick={close}
                >
                  <AppIcon icon="close" />
                </Button>
              </TooltipHint>
            </div>
          </div>
          {notifications.length === 0 && !loading && (
            <EmptyState
              description={app_notifications_empty_description()}
              icon="notifications-bell"
              title={app_notifications_empty_title()}
            />
          )}
          {notifications.length > 0 && (
            <ul className="app-notifications-list">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    className="app-notification"
                    data-unread={!notification.read || undefined}
                    data-kind={notification.kind}
                    onClick={() => {
                      markRead([notification.id]);
                      close();
                      void navigate({
                        to:
                          notification.kind === "opportunity"
                            ? "/app/opportunities"
                            : "/app/tasks",
                      });
                    }}
                  >
                    <span className="app-notification-title">
                      <bdi>{notification.title}</bdi>
                    </span>
                    {/* The unread dot (::after) is visual only. */}
                    {!notification.read && (
                      <span className="sr-only">
                        {app_notification_unread()}
                      </span>
                    )}
                    {notification.body && (
                      <span className="app-notification-body">
                        <bdi>{notification.body}</bdi>
                      </span>
                    )}
                    <time
                      className="app-notification-time"
                      dateTime={notification.createdAt}
                    >
                      {formatTimeAgo(notification.createdAt)}
                    </time>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    >
      <span className="app-notifications-bell">
        <AppIcon icon="notifications-bell" />
        {unread > 0 && (
          <span className="app-notifications-count" aria-hidden="true">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </span>
    </SmoothDropdown>
  );
};
