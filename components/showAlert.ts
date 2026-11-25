import { Alert, AlertButton, AlertOptions, Platform } from "react-native";

/**
 * Náhrada za Alert.alert, která funguje i na webu.
 * - iOS/Android: volá přímo Alert.alert (chování beze změny).
 * - Web: bez tlačítek nebo s jedním tlačítkem použije window.alert,
 *   s více tlačítky window.confirm (OK = poslední tlačítko, které není "cancel",
 *   Zrušit = tlačítko se style "cancel").
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
): void {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons, options);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  const cancelButton = buttons.find((b) => b.style === "cancel");
  const actionButtons = buttons.filter((b) => b !== cancelButton);
  const confirmButton = actionButtons[actionButtons.length - 1];

  if (window.confirm(text)) {
    confirmButton?.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}
