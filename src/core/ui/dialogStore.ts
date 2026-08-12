import type { LucideIcon } from "lucide-react-native";
import { create } from "zustand";

export type DialogButton = {
  label: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void | Promise<void>;
};

export type DialogOptions = {
  variant?: "center" | "sheet";
  icon?: LucideIcon;
};

type DialogState = {
  open: boolean;
  title: string;
  message?: string;
  buttons: DialogButton[];
  variant: "center" | "sheet";
  icon?: LucideIcon;
};

type DialogActions = {
  alert: (
    title: string,
    message?: string,
    buttons?: DialogButton[],
    opts?: DialogOptions,
  ) => void;
  hide: () => void;
};

const normalizeButtons = (buttons?: DialogButton[]) => {
  const safeButtons =
    buttons && buttons.length > 0 ? [...buttons] : [{ label: "OK" }];
  const hasCancel = safeButtons.some((button) => button.style === "cancel");
  if (safeButtons.length > 1 && !hasCancel) {
    safeButtons.push({ label: "Cancel", style: "cancel" });
  }
  return safeButtons;
};

const initialState: DialogState = {
  open: false,
  title: "",
  message: undefined,
  buttons: [{ label: "OK" }],
  variant: "center",
  icon: undefined,
};

export const useDialogStore = create<DialogState & DialogActions>((set) => ({
  ...initialState,
  alert: (title, message, buttons, opts) => {
    const normalizedButtons = normalizeButtons(buttons);
    const variant =
      opts?.variant ??
      (normalizedButtons.filter((button) => button.style !== "cancel").length >=
      3
        ? "sheet"
        : "center");

    set({
      open: true,
      title,
      message,
      buttons: normalizedButtons,
      variant,
      icon: opts?.icon,
    });
  },
  hide: () => set({ ...initialState }),
}));

export const dialog = {
  alert: (
    title: string,
    message?: string,
    buttons?: DialogButton[],
    opts?: DialogOptions,
  ) => useDialogStore.getState().alert(title, message, buttons, opts),
  hide: () => useDialogStore.getState().hide(),
};
