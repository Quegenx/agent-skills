import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type { ComponentProps, ReactNode } from "react";

import { app_cancel, app_delete } from "#/paraglide/messages";
import { AppDialogHeader } from "@/components/ui/feedback/dialog/app-dialog-header";
import { Button } from "@/components/ui/general/button";

// Confirm dialog; styles and measurements live in styles/ui/feedback/dialog.css.
// Built on Base UI's Dialog, not its AlertDialog, so a press outside it or
// Escape closes it as the settings dialog closes (AlertDialog ignores a
// press outside); it is still announced as an alertdialog. A caller that
// must not close mid-action refuses in onOpenChange, as sign-out does while
// it runs.
const AlertDialog = (props: DialogPrimitive.Root.Props) => (
  <DialogPrimitive.Root data-slot="alert-dialog" {...props} />
);

// Its content is one wrapper, so a dialog that grows out of its button
// (pass useDialogMorph's props, as sign-out does) can counter-scale it.
const AlertDialogContent = ({
  title,
  children,
  ...props
}: Omit<DialogPrimitive.Popup.Props, "className"> & {
  title: ReactNode;
}) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Backdrop className="app-backdrop" />
    <DialogPrimitive.Popup
      data-slot="alert-dialog-content"
      className="app-dialog"
      role="alertdialog"
      {...props}
    >
      <div>
        <AppDialogHeader title={title} />
        {children}
      </div>
    </DialogPrimitive.Popup>
  </DialogPrimitive.Portal>
);

const AlertDialogDescription = (
  props: Omit<DialogPrimitive.Description.Props, "className">
) => (
  <DialogPrimitive.Description
    className="app-dialog-description"
    {...props}
  />
);

const AlertDialogFooter = (props: Omit<ComponentProps<"div">, "className">) => (
  <div className="app-dialog-footer" {...props} />
);

// Closes without acting: the app's gray secondary Button, as every other
// cancel.
const AlertDialogCancel = (
  props: Omit<DialogPrimitive.Close.Props, "className" | "render">
) => (
  <DialogPrimitive.Close render={<Button variant="secondary" />} {...props} />
);

// Performs the confirmed action, as the app's Button: blue, or red
// (variant "destructive") when it deletes or signs out. The caller closes the
// dialog when it is done.
const AlertDialogAction = ({
  variant = "default",
  ...props
}: Omit<ComponentProps<typeof Button>, "className" | "type" | "variant"> & {
  variant?: "default" | "destructive";
}) => <Button type="button" variant={variant} {...props} />;

// Asks before deleting something: its name (bidi-isolated, as people write
// it), what deleting it means, then Cancel and Delete. onConfirm deletes;
// the dialog is closed through onOpenChange.
const ConfirmDeleteDialog = ({
  description,
  onConfirm,
  onOpenChange,
  open,
  subject,
  title,
}: {
  description: ReactNode;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  subject: string | undefined;
  title: string;
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent title={title}>
      <AlertDialogDescription>
        <bdi>{subject}</bdi>
        <br />
        {description}
      </AlertDialogDescription>
      <AlertDialogFooter>
        <AlertDialogCancel>{app_cancel()}</AlertDialogCancel>
        <AlertDialogAction variant="destructive" onClick={onConfirm}>
          {app_delete()}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  ConfirmDeleteDialog,
};
