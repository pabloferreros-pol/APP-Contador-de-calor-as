import type { CapacitorConfig } from "@capacitor/cli";

/**
 * ⬇⬇⬇  ÚNICO VALOR QUE TENÉS QUE CAMBIAR  ⬇⬇⬇
 * Pegá acá la URL pública de tu app, sin barra final.
 * Ejemplo: "https://contador-calorias.vercel.app"
 */
const APP_URL = "https://contadordecaloriaseli.grok.me";

const config: CapacitorConfig = {
  appId: "ar.cordoba.contadorcalorias",
  appName: "Contador de calorias",
  webDir: "www",

  server: {
    // El APK abre esta URL dentro de su propia WebView.
    url: APP_URL,
    androidScheme: "https",
    cleartext: false,
  },

  android: {
    allowMixedContent: false,
    // Deja que el <input type="file" capture> abra la cámara del sistema.
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#f3ede4",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
