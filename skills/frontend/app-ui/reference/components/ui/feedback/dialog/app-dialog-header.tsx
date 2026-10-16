import { Dialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";

import { app_close } from "#/paraglide/messages";
import { TooltipHint } from "@/components/ui/display/tooltip";
import { AppIcon } from "@/components/ui/general/app-icon";

/**
 * A dialog's header (styles/ui/feedback/dialog.css): its title and the close button.
 *
 * @returns The header.
 */
export const AppDialogHeader = ({ title }: { title: ReactNode }) => (
  <div className="app-dialog-header">
    <Dialog.Title className="app-dialog-title">{title}</Dialog.Title>
    <TooltipHint label={app_close()} side="bottom">
      <Dialog.Close
        className="app-dialog-close"
        aria-label={app_close()}
      >
        <AppIcon icon="agent-close" />
      </Dialog.Close>
    </TooltipHint>
  </div>
);
