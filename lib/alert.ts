import { Alert as RNAlert, AlertButton, Platform } from 'react-native';

// react-native-web no implementa Alert.alert, así que en web usamos los diálogos del navegador.
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS !== 'web') return RNAlert.alert(title, message, buttons);

    const text = message ? `${title}\n\n${message}` : title;
    const action = buttons?.find((b) => b.style !== 'cancel');
    if (buttons && buttons.length > 1) {
      if (window.confirm(text)) action?.onPress?.();
      else buttons.find((b) => b.style === 'cancel')?.onPress?.();
    } else {
      window.alert(text);
      action?.onPress?.();
    }
  },
};
