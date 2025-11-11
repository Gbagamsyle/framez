/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';


export const Colors = {
  background: '#181A1B',     // graphite dark
  text: '#E8E8E8',           // soft white
  accent: '#3BA7FF',         // classy neon/cyan blue
  card: '#202223',
  cardBorder: '#2D2F30',
  inputBackground: '#252728',
  placeholder: '#9FA2A4',
  primary: '#3BA7FF',
  secondary: '#E8E8E8',
  error: '#E85151',
  success: '#3ECF8E',
};







export const Fonts = Platform.select({
  ios: {
    serif: 'Times New Roman',
    sans: 'system-ui',
  },
  default: {
    serif: 'serif',
    sans: 'sans-serif',
  },
  web: {
    serif: "Georgia, 'Times New Roman', serif",
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
});
