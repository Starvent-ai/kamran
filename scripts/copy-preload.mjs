import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// tsc only compiles .ts files, so any plain static asset the main
// process loads at runtime (preload script, splash screen) has to be
// copied into dist-electron by hand as a post-build step — this script
// runs right after `tsc -p tsconfig.main.json` in the build:main script.

const preloadSrc = path.join(root, "src/main/preload.cjs");
const preloadDestDir = path.join(root, "dist-electron/preload");
const preloadDest = path.join(preloadDestDir, "index.cjs");

await mkdir(preloadDestDir, { recursive: true });
await copyFile(preloadSrc, preloadDest);
console.log(`[copy-preload] ${preloadSrc} -> ${preloadDest}`);

const splashSrc = path.join(root, "src/main/splash.html");
const splashDestDir = path.join(root, "dist-electron/main");
const splashDest = path.join(splashDestDir, "splash.html");

await mkdir(splashDestDir, { recursive: true });
await copyFile(splashSrc, splashDest);
console.log(`[copy-preload] ${splashSrc} -> ${splashDest}`);
