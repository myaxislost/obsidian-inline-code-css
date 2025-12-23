import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import chokidar from "chokidar";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

const outMain = path.join(projectRoot, "main.js");
const outStyles = path.join(projectRoot, "styles.css");

function isRetriableWinError(err) {
  return (
    err &&
    (err.code === "EPERM" ||
      err.code === "EBUSY" ||
      err.code === "EACCES")
  );
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function withRetries(fn, attempts = 30, delayMs = 50) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetriableWinError(err)) throw err;
      await sleep(delayMs);
    }
  }
  throw lastErr;
}

async function waitForStableFile(filePath, checks = 6, intervalMs = 40) {
  // Avoid reading while Vite is still writing the file.
  let prevSize = -1;
  for (let i = 0; i < checks; i++) {
    const s = await stat(filePath);
    if (s.size === prevSize) return;
    prevSize = s.size;
    await sleep(intervalMs);
  }
}

async function firstCssInDist() {
  try {
    const files = await readdir(distDir);
    const css = files.find((f) => f.toLowerCase().endsWith(".css"));
    return css ? path.join(distDir, css) : null;
  } catch {
    return null;
  }
}

async function overwriteFileFrom(srcPath, destPath) {
  await waitForStableFile(srcPath);

  // writeFile() replaces the file if it already exists. :contentReference[oaicite:1]{index=1}
  const data = await readFile(srcPath);
  await withRetries(() => writeFile(destPath, data));
}

async function syncOnce() {
  const builtMain = path.join(distDir, "main.js");
  await overwriteFileFrom(builtMain, outMain);

  const cssPath = await firstCssInDist();
  if (cssPath) {
    await overwriteFileFrom(cssPath, outStyles);
  }
}

const watch = process.argv.includes("--watch");

if (!watch) {
  await syncOnce();
  process.exit(0);
}

await syncOnce();

const watcher = chokidar.watch(distDir, {
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 150,
    pollInterval: 25
  }
});

watcher.on("add", syncOnce);
watcher.on("change", syncOnce);

process.on("SIGINT", async () => {
  await watcher.close();
  process.exit(0);
});
