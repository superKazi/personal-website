// A previous worker's document can outlive the bundle it names. Offline must use the current precache instead.
// Usage: pnpm run offline-check [webkit,firefox,chromium]
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, firefox, webkit } from "playwright";
import { build, preview } from "vite";

const engines = { webkit, firefox, chromium };
const names = (process.argv[2] ?? "webkit,firefox,chromium").split(",");
const output = await mkdtemp(join(tmpdir(), "website-offline-check-"));
let server;
try {
  await build({
    logLevel: "error",
    build: { outDir: output, emptyOutDir: true },
  });
  server = await preview({
    logLevel: "error",
    build: { outDir: output },
    preview: { port: 0 },
  });
  const url = server.resolvedUrls.local[0];
  for (const name of names) {
    const browser = await engines[name].launch();
    try {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
      });
      const page = await context.newPage();
      const response = await page.goto(url);
      const html = await response.text();
      await page
        .getByRole("button", { name: "Turn on audio experience" })
        .waitFor();
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      const asset = await page
        .locator('script[type="module"]')
        .getAttribute("src");
      const stale = html.replace(asset, "/assets/retired-bundle.js");
      assert.notEqual(stale, html);
      await page.evaluate(async (stale) => {
        const cache = await caches.open("document-cache");
        await cache.put(
          location.href,
          new Response(stale, {
            headers: { "Content-Type": "text/html" },
          }),
        );
      }, stale);
      await context.setOffline(true);
      await page.reload();
      await page.waitForFunction(
        () => document.body.classList.contains("ready"),
        null,
        { timeout: 10000 },
      );
      assert.equal(
        await page.locator('script[type="module"]').getAttribute("src"),
        asset,
      );
      console.log(
        `pass ${name}: offline uses the current artwork, not a stale document`,
      );
    } catch (error) {
      console.error(`FAIL ${name}: ${String(error).split("\n")[0]}`);
      process.exitCode = 1;
    } finally {
      await browser.close();
    }
  }
} finally {
  if (server) await new Promise((resolve) => server.httpServer.close(resolve));
  await rm(output, { recursive: true, force: true });
}
