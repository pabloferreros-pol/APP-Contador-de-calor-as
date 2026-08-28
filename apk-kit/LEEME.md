# APK de "Contador de calorías" con Capacitor

Este kit genera un APK instalable que abre tu app desplegada dentro de su propia
WebView nativa. No depende de Chrome ni del navegador: es una app Android real,
con su ícono, su splash y su entrada en el cajón de aplicaciones.

---

## Paso 0 — Poné tu URL (obligatorio)

Abrí `capacitor.config.ts` y cambiá esta línea:

```ts
const APP_URL = "https://REEMPLAZAR-CON-TU-URL.vercel.app";
```

Sin barra al final. Si no lo hacés, el build falla a propósito para avisarte.

Mientras estás ahí, si querés, cambiá también:

- `appId` — el identificador único del paquete (`ar.cordoba.contadorcalorias`).
  Una vez que lo publicás no se puede cambiar, así que elegilo ahora.
- `appName` — el nombre que se ve debajo del ícono.

---

## Camino A — GitHub Actions (no instalás nada)

Ideal si no tenés Android Studio.

1. Creá un repo nuevo en GitHub y subí esta carpeta entera (que quede en la raíz,
   con `.github/` incluido).
2. En el repo, andá a la pestaña **Actions**.
3. Elegí **Generar APK** → **Run workflow**.
4. Esperá unos 5–8 minutos.
5. Cuando termina, entrá al run y bajá el artifact **contador-calorias-apk**.
   Adentro está `app-debug.apk`.

Pasá ese archivo al teléfono, tocalo y aceptá "instalar de orígenes desconocidos".

---

## Camino B — En tu compu

Necesitás Node 22, Java 21 y el SDK de Android (lo más simple es instalar
Android Studio, que trae todo).

```bash
npm install
npx cap add android
node scripts/apply-assets.mjs
npx cap sync android
cd android && ./gradlew assembleDebug
```

El APK queda en:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Con el celu enchufado por USB y depuración USB activada, lo instalás directo:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Qué incluye este kit

| Archivo                             | Para qué sirve                                          |
| ----------------------------------- | ------------------------------------------------------- |
| `capacitor.config.ts`               | Configuración: URL, nombre, ID, splash                   |
| `resources/android/mipmap-*`        | Íconos en las 5 densidades, generados desde tu ícono web |
| `resources/android/drawable/splash` | Pantalla de arranque                                     |
| `scripts/apply-assets.mjs`          | Copia íconos y agrega el permiso de cámara               |
| `www/index.html`                    | Pantalla de "sin conexión"                               |
| `.github/workflows/build-apk.yml`   | Compilación automática en la nube                        |

---

## Notas importantes

**La cámara funciona.** Tu app usa `<input type="file" capture="environment">`,
que la WebView de Capacitor maneja abriendo la cámara del sistema. Por eso el
script agrega el permiso `CAMERA` al manifest.

**Sigue necesitando internet.** El análisis de la foto corre en una server
function en Vercel, así que la app no funciona offline. Si algún día querés eso,
hay que mover el análisis al dispositivo o cachear los datos localmente — es otro
proyecto.

**Este APK es "debug".** Está firmado con la clave de debug de Android: se
instala sin problema en cualquier teléfono, pero no sirve para publicar en Play
Store. Para eso hay que generar una keystore propia y hacer `assembleRelease`.
Avisame cuando llegues a esa instancia y te paso los pasos.

**Actualizaciones gratis.** Como el APK carga tu URL, cada vez que hacés deploy
en Vercel la app se actualiza sola. Solo necesitás recompilar el APK si cambiás
el ícono, el nombre o la URL.
