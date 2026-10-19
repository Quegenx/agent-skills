import { Dialog } from "@base-ui/react/dialog";
import { RegistryContext } from "@effect/atom-react";
import {
  getRouteApi,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { Effect } from "effect";
import { useContext, useRef, useState } from "react";

import {
  app_cancel,
  app_close,
  app_nav_settings,
  app_profile_picture,
  app_sign_out,
  app_sign_out_confirm_description,
  app_sign_out_confirm_title,
  app_sign_out_failed,
  app_sign_out_pending,
  app_sign_out_unsaved,
} from "#/paraglide/messages";
import { UserAvatar } from "@/components/layout/shell/user-avatar";
import { TooltipHint } from "@/components/ui/display/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/feedback/dialog/alert-dialog";
import { useDialogMorph } from "@/components/ui/feedback/dialog/dialog-morph";
import { useFlightMorph } from "@/components/ui/feedback/dialog/flight-morph";
import { AppIcon } from "@/components/ui/general/app-icon";
import { MorphText } from "@/components/ui/general/morph-text";
import { useSidebar } from "@/components/ui/navigation/sidebar/sidebar-context";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/navigation/sidebar/sidebar-menu";
import { runClientEffect } from "@/lib/atoms/app-atom-runtime";
import { authErrorMessage } from "@/lib/auth/auth-error-message";
import { SessionServerCalls } from "@/lib/auth/session-server-calls";
import { forgetSessionUser } from "@/lib/auth/session-user-atom";
import {
  cancelUserSettingsWrites,
  flushUserSettingsWrites,
} from "@/lib/settings/user-settings/user-settings-atoms";
import { flushUserPageStates } from "@/lib/user-state/user-page-state-atom";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

const appRouteApi = getRouteApi("/app/_app");

// Saves the latest settings and page edits, then ends the session: null once
// signed out, or why not (nothing is signed out when an edit did not save).
const saveAndSignOut = Effect.gen(function* saveAndSignOutOfApp() {
  const saved = yield* Effect.all(
    [flushUserSettingsWrites, flushUserPageStates],
    { concurrency: "unbounded" }
  );

  if (!saved.every(Boolean)) {
    return app_sign_out_unsaved();
  }

  const result = yield* (yield* SessionServerCalls).signOutSession;

  return isNonEmptyText(result.error) ? authErrorMessage(result.error) : null;
});

/**
 * The signed-in user, their settings (the settings dialog, opened through
 * the URL's ?settings=), and sign-out after confirmation, which returns to
 * the login page.
 *
 * @returns The account menu.
 */
export const AppSidebarAccount = () => {
  const { user } = appRouteApi.useRouteContext();
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  const navigate = useNavigate();
  const registry = useContext(RegistryContext);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  // The confirmation grows out of התנתקות, as the chat search out of its row.
  const signOutMorph = useDialogMorph(confirmOpen);
  // The avatar, enlarged in the middle of the screen over the backdrop the
  // way iOS opens a contact's photo: it flies out of the sidebar's avatar
  // and back into it (useFlightMorph, tor-app's favorite flight). Its X, the
  // backdrop or Escape closes it.
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const avatarFlight = useFlightMorph(avatarOpen, avatarRef);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="app-sidebar-account">
          <TooltipHint label={app_profile_picture()}>
            <button
              ref={avatarRef}
              type="button"
              className="app-sidebar-avatar-button"
              aria-label={app_profile_picture()}
              onClick={() => {
                setAvatarOpen(true);
              }}
            >
              <UserAvatar userId={user.id} className="app-sidebar-avatar" />
            </button>
          </TooltipHint>
          {/* The whole address, when the sidebar cuts it short. */}
          <TooltipHint label={user.email}>
            <p className="app-sidebar-account-text">
              <strong>{user.name ?? user.email}</strong>
              {isNonEmptyText(user.name) && <bdi>{user.email}</bdi>}
            </p>
          </TooltipHint>
        </div>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          render={
            <Link
              to="."
              search={(current) => ({ ...current, settings: "profile" })}
            />
          }
          onClick={() => {
            setOpenMobile(false);
          }}
        >
          {/* One child, so the settings grow out of this row
              (useDialogMorph morphs only a one-element button). */}
          <span className="app-sidebar-row-content">
            <span className="app-sidebar-row-icon">
              <AppIcon icon="nav-settings" />
            </span>
            <span>{app_nav_settings()}</span>
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => {
            setConfirmOpen(true);
          }}
        >
          {/* One child, so the confirmation grows out of this row. */}
          <span className="app-sidebar-row-content">
            <span className="app-sidebar-row-icon">
              <AppIcon icon="logout" />
            </span>
            <span>{app_sign_out()}</span>
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <Dialog.Root open={avatarOpen} onOpenChange={setAvatarOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="app-backdrop" />
          <Dialog.Popup
            className="app-avatar-viewer"
            aria-label={user.name ?? user.email}
            {...avatarFlight}
          >
            <UserAvatar userId={user.id} className="app-avatar-viewer-image" />
            <TooltipHint label={app_close()} side="bottom">
              <Dialog.Close
                className="app-dialog-close app-avatar-viewer-close"
                aria-label={app_close()}
              >
                <AppIcon icon="agent-close" />
              </Dialog.Close>
            </TooltipHint>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!pending) {
            setConfirmOpen(open);
          }
        }}
      >
        <AlertDialogContent
          {...signOutMorph}
          title={app_sign_out_confirm_title()}
        >
          <AlertDialogDescription>
            {app_sign_out_confirm_description()}
          </AlertDialogDescription>
          {isNonEmptyText(signOutError) && (
            <p role="alert" className="text-sm text-destructive">
              {signOutError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {app_cancel()}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => {
                setPending(true);
                setSignOutError(null);
                void runClientEffect(
                  registry,
                  saveAndSignOut.pipe(
                    Effect.orElseSucceed(() => app_sign_out_failed()),
                    Effect.flatMap((refusal) =>
                      refusal
                        ? Effect.sync(() => {
                            setSignOutError(refusal);
                            setPending(false);
                          })
                        : Effect.promise(async () => {
                            // The account keeps its state; this browser
                            // forgets what it showed for it when the
                            // registry resets below.
                            cancelUserSettingsWrites();
                            forgetSessionUser(registry);
                            await router.invalidate();
                            await navigate({ to: "/app/login" });
                            // Off the app's pages, so no page reads the atoms
                            // again; every page's state goes with them.
                            registry.reset();
                          })
                    )
                  )
                );
              }}
            >
              <MorphText>
                {pending ? app_sign_out_pending() : app_sign_out()}
              </MorphText>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMenu>
  );
};
