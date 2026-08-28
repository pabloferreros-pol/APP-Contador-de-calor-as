/**
 * Compila el APK de punta a punta.
 * Detecta el JDK y el SDK de Android solo. Funciona en Windows, macOS y Linux.
 *
 *   npm install
 *   npm run apk
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

const WIN = process.platform === "win32";
const MAC = process.platform === "darwin";
const HOME = homedir();

const log = (m) => console.log(`\n\x1b[36m▸ ${m}\x1b[0m`);
const ok = (m) => console.log(`\x1b[32m✓\x1b[0m ${m}`);
const die = (m) => {
  console.error(`\n\x1b[31m✗ ${m}\x1b[0m\n`);
  process.exit(1);
};

// ─── 1. Verificar que la URL fue configurada ────────────────────────────────
const cfg = readFileSync("capacitor.config.ts", "utf8");
if (cfg.includes("REEMPLAZAR-CON-TU-URL")) {
  die(
    "Falta tu URL.\n  Abrí capacitor.config.ts y reemplazá APP_URL por la URL real de tu app.\n  Ejemplo: const APP_URL = \"https://mi-app.vercel.app\";",
  );
}
const urlMatch = cfg.match(/const APP_URL = "([^"]+)"/);
ok(`URL configurada: ${urlMatch ? urlMatch[1] : "(no se pudo leer)"}`);

// ─── 2. Encontrar el JDK ────────────────────────────────────────────────────
log("Buscando el JDK");
const jdkCandidates = [
  process.env.JAVA_HOME,
  WIN && "C:\\Program Files\\Android\\Android Studio\\jbr",
  WIN && "C:\\Program Files\\Android\\Android Studio\\jre",
  WIN && join(HOME, "AppData\\Local\\Programs\\Android Studio\\jbr"),
  MAC && "/Applications/Android Studio.app/Contents/jbr/Contents/Home",
  !WIN && !MAC && "/opt/android-studio/jbr",
].filter(Boolean);

const javaHome = jdkCandidates.find((p) => existsSync(join(p, "bin", WIN ? "java.exe" : "java")));
if (!javaHome) {
  die(
    "No encontré un JDK.\n  Si tenés Android Studio instalado en otra carpeta, definí JAVA_HOME apuntando a su subcarpeta 'jbr'.",
  );
}
ok(`JDK: ${javaHome}`);

// ─── 3. Encontrar el SDK de Android ─────────────────────────────────────────
log("Buscando el SDK de Android");
const sdkCandidates = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  WIN && join(HOME, "AppData\\Local\\Android\\Sdk"),
  MAC && join(HOME, "Library/Android/sdk"),
  !WIN && !MAC && join(HOME, "Android/Sdk"),
].filter(Boolean);

const sdkHome = sdkCandidates.find((p) => existsSync(join(p, "platform-tools")) || existsSync(join(p, "platforms")));
if (!sdkHome) {
  die(
    "No encontré el SDK de Android.\n  Abrí Android Studio → Settings → Languages & Frameworks → Android SDK\n  y copiá la ruta que dice 'Android SDK Location'. Después definí ANDROID_HOME con ese valor.",
  );
}
ok(`SDK: ${sdkHome}`);

const env = { ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: sdkHome, ANDROID_SDK_ROOT: sdkHome };

// ─── 4. Helper para correr comandos ─────────────────────────────────────────
function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: WIN, env, ...opts });
  if (r.status !== 0) die(`Falló: ${cmd} ${args.join(" ")}`);
}

// ─── 5. Dependencias ────────────────────────────────────────────────────────
if (!existsSync("node_modules")) {
  log("Instalando dependencias");
  run("npm", ["install"]);
}

// ─── 6. Proyecto Android ────────────────────────────────────────────────────
if (!existsSync("android")) {
  log("Creando el proyecto Android");
  run("npx", ["cap", "add", "android"]);
} else {
  ok("El proyecto Android ya existe");
}

// local.properties: le dice a Gradle dónde está el SDK
writeFileSync(join("android", "local.properties"), `sdk.dir=${sdkHome.replace(/\\/g, "/")}\n`);

// ─── 7. Iconos, splash y permisos ───────────────────────────────────────────
log("Aplicando iconos, splash y permisos");
run(process.execPath, ["scripts/apply-assets.mjs"]);

// ─── 8. Sincronizar ─────────────────────────────────────────────────────────
log("Sincronizando Capacitor");
run("npx", ["cap", "sync", "android"]);

// ─── 9. Compilar ────────────────────────────────────────────────────────────
log("Compilando el APK (la primera vez tarda varios minutos)");
run(WIN ? "gradlew.bat" : "./gradlew", ["assembleDebug"], { cwd: "android" });

// ─── 10. Copiar el resultado ────────────────────────────────────────────────
const outDir = join("android", "app", "build", "outputs", "apk", "debug");
const apk = readdirSync(outDir).find((f) => f.endsWith(".apk"));
if (!apk) die("La compilación terminó pero no encontré el .apk");

const final = "contador-calorias.apk";
copyFileSync(join(outDir, apk), final);

console.log(`\n\x1b[32m╭──────────────────────────────────────────╮`);
console.log(`│  APK listo                               │`);
console.log(`╰──────────────────────────────────────────╯\x1b[0m`);
console.log(`\n  ${resolve(final)}\n`);
console.log(`  Pasalo al celular y tocalo para instalar.`);
console.log(`  O con el cable conectado y depuración USB activada:\n`);
console.log(`      adb install -r ${final}\n`);
