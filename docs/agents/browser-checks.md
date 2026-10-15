# Browser checks

Check the piece with Playwright scripts, in WebKit, Firefox and Chromium. Bugs here are engine-specific (Safari played loud Chimes and Firefox buzzed while Chrome stayed clean), so a Chrome-only check proves little. `scripts/audio-check.mjs` is the working model: copy its server, page setup and Rustle.

## Writing a check

1. Put throwaway scripts in `scripts/` as `.scratch-*.mjs` (gitignored), so they resolve the repo's `playwright` and `vite`. Delete them when done.
2. Start Vite from the script with `createServer({ logLevel: "error", server: { port } })` and `await server.listen()`, then read the URL from `server.resolvedUrls.local[0]`; close it in a `finally`. Leave the user's own `vite --host` server running.
3. Open the page at a 1280×800 viewport. The intro takes about 4 s: wait for `page.getByRole("button", { name: "Turn on audio experience" })`, which stays out of the accessibility tree until the intro ends.
4. Hide the dev gui before clicking anything; it covers the Sound toggle: `document.querySelector(".lil-gui")?.style.setProperty("display", "none")`.
5. Playwright's clicks are real user gestures, so clicking the Sound toggle starts audio in every engine.
6. Keep files untouched while a check runs: any save reloads the page through HMR, mid-test.

Rustle with `page.mouse.move`, which sends real pointer events. The word's diagonal at 1280×800 is `(300 + k * 650, 620 - k * 440)` for `k` from 0 to 1. `audio-check` adds seeded jitter and random reversals to imitate a hand.

Reduced motion: `await page.emulateMedia({ reducedMotion: "reduce" })`, and call it again with `"no-preference"` to switch back mid-run.

## Audio checks

Run `pnpm run audio-check` (or `pnpm run audio-check webkit`) after any change to `src/js/audio.ts`, and before opening its PR; CI doesn't run it. It Rustles the live page in all three engines (about 70 s), records the output from an AudioWorklet, and fails on:

- **loud**: an output peak over 0.5 (normal is about 0.2).
- **buzz**: energy above 4.5 kHz over -70 dB relative to the whole signal. Chimes have almost nothing up there, so a buzz shows even ~55 dB down.

To prove a check is red-capable, run it from a worktree of an older commit: `git worktree add /tmp/prefix <sha>`, symlink `node_modules` into it, then `cd /tmp/prefix && node <repo>/scripts/audio-check.mjs`.

Recording gotchas:

- Record from an AudioWorklet. A ScriptProcessor tap runs on the main thread and loses blocks under load; the seams read as buzz.
- A probe that hooks Web Audio also hooks any offline renders you run in the same page. Snapshot the recording first.

## When the user's ear disagrees

Synthetic pointer events don't reproduce real hand input: hands jiggle, move slowly, and retrigger the same Panels. When the user hears a problem your measurements miss, trust the ear. Two ways to turn it into a loop:

- Have the user bisect one setting at a time in `src/js/config.ts`; lil-gui tunes colors only. That found the crackle (the Chime `knock`) in one round.
- Save the recording as a WAV for the user to listen to, confirming the measurement and the sound they hear are the same thing. That's how the Firefox buzz check was validated.

## Beyond Playwright

- **Performance**: traces, Lighthouse and heap snapshots go through the Chrome DevTools MCP, whose insights come pre-digested. It's Chrome-only.
- **Real Safari**: Playwright's WebKit shares Safari's audio code, not the whole app. `open -a Safari <url>` runs a page in real Safari; post results back to a local server, since there's no console access. `safaridriver` drives it once Develop → Allow Remote Automation is on.
- **iOS**: `xcrun simctl openurl booted <url>` and `xcrun simctl io booted screenshot <file>`. The Xcode MCP only starts a device session after an `.xcodeproj` has been opened, which this repo doesn't have.

Tool-output redaction rewrites long digit runs, such as the LCG modulus 2³¹ − 1 written out. Write `2 ** 31 - 1`.
