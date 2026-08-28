/**
 * Aplica iconos, splash y permisos al proyecto Android generado por `cap add android`.
 * Se corre despues de `cap add android` y antes de `cap sync`.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RES = "android/app/src/main/res";
const MANIFEST = "android/app/src/main/AndroidManifest.xml";
const DENSITIES = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];
const ICONS = ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"];

if (!existsSync("android")) {
  console.error("No existe la carpeta android/. Corré primero: npx cap add android");
  process.exit(1);
}

// 1. Iconos por densidad
for (const d of DENSITIES) {
  const from = join("resources/android", `mipmap-${d}`);
  const to = join(RES, `mipmap-${d}`);
  mkdirSync(to, { recursive: true });
  for (const icon of ICONS) {
    const src = join(from, icon);
    if (existsSync(src)) copyFileSync(src, join(to, icon));
  }
}
console.log("✓ Iconos copiados");

// 2. Splash
const splash = "resources/android/drawable/splash.png";
if (existsSync(splash)) {
  mkdirSync(join(RES, "drawable"), { recursive: true });
  copyFileSync(splash, join(RES, "drawable", "splash.png"));
  console.log("✓ Splash copiado");
}

// 3. Color de fondo del icono adaptativo
mkdirSync(join(RES, "values"), { recursive: true });
writeFileSync(
  join(RES, "values", "ic_launcher_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#f3ede4</color>
</resources>
`,
);
console.log("✓ Color de fondo del icono");

// 4. Permiso de camara (para el <input type="file" capture="environment">)
let manifest = readFileSync(MANIFEST, "utf8");
const extras = `    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
`;

if (!manifest.includes("android.permission.CAMERA")) {
  const anchor = '<uses-permission android:name="android.permission.INTERNET" />';
  if (manifest.includes(anchor)) {
    manifest = manifest.replace(anchor, `${anchor}\n${extras.trimEnd()}`);
  } else {
    manifest = manifest.replace("</manifest>", `${extras}</manifest>`);
  }
  writeFileSync(MANIFEST, manifest);
  console.log("✓ Permiso de cámara agregado");
} else {
  console.log("• El permiso de cámara ya estaba");
}

console.log("\nListo. Siguiente paso: npx cap sync android");
