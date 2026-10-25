# Browser checks

Check the piece with Playwright scripts, in WebKit, Firefox and Chromium. Bugs here are engine-specific (Safari played loud Chimes and Firefox buzzed while Chrome stayed clean), so a Chrome-only check proves little. `scripts/audio-check.mjs` is the working model: copy its server, page setup and Rustle.

## Writing a check

1. Put throwaway scripts in `scripts/` as `.scratch-*.mjs` (gitignored), so they resolve the repo's `playwright` and `vite`. Delete them when done.
2. Start Vite from the script with `createServer({ logLevel: "error", server: { port } })` and `await server.listen()`, then read the URL from `server.resolvedUrls.local[0]`; close it in a `finally`. Leave the user's own `vite --host` server running.
3. Open the page at a 1280×800 viewport. The intro takes about 4 s: wait for `page.getByRole("button", { name: "Turn on audio experience" })`, which stays out of the accessibility tree until the intro ends.
4. Playwright's clicks are real user gestures, so clicking the Sound toggle starts audio in every engine.
5. Keep files untouched while a check runs: any save reloads the page through HMR, mid-test.

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

- Have the user bisect one setting at a time in `src/js/config.ts`. That found the crackle (the Chime `knock`) in one round.
- Save the recording as a WAV for the user to listen to, confirming the measurement and the sound they hear are the same thing. That's how the Firefox buzz check was validated.

## Beyond Playwright

- **Performance**: traces, Lighthouse and heap snapshots go through the Chrome DevTools MCP, whose insights come pre-digested. It's Chrome-only.
- **Real Safari**: Playwright's WebKit shares Safari's audio code, not the whole app. `open -a Safari <url>` runs a page in real Safari; post results back to a local server, since there's no console access. `safaridriver` drives it once Develop → Allow Remote Automation is on.
- **iOS Safari**: use the simulator procedure below for native touch input, UI hierarchy and screenshots.

## iOS simulator

Use Safari, not a native app wrapper. No committed Xcode project or extra website dependency is needed.

1. Start `pnpm dev`, or reuse an existing Vite server. Use its printed localhost URL; the simulator can reach the Mac's loopback interface.
2. List devices with `xcrun simctl list devices available` and choose a UUID. Boot it with `xcrun simctl boot <uuid>` only if shut down, then wait with `xcrun simctl bootstatus <uuid> -b`. Prefer an explicit UUID over `booted` when several simulators are running.
3. For the simulator UI in Xcode 27, open Device Hub: `open /Applications/Xcode.app/Contents/Applications/DeviceHub.app`. Looking only for the old `Simulator.app` path incorrectly suggests that the GUI is missing.
4. If the Xcode MCP asks for agent approval, use `XcodeOpenWorkspace` to open a local-only workspace. An empty `.xcworkspace` directory with `contents.xcworkspacedata` containing `<Workspace version="1.0"></Workspace>` suffices to request approval; keep it outside the repo. Our local workspace is `~/Library/Caches/personal-website-simulator/WebsiteTesting.xcworkspace`. Opening an empty workspace may time out waiting for a run destination even after approval succeeds; retry session creation before treating that as a blocker.
5. Call `DeviceInteractionStartSession` with the device UUID and a session identifier. Use the returned interaction session key for subsequent calls. Use this workspace-free session, not `DeviceInteractionStartWorkspaceSession`: there is no app to build or install.
6. Open the site with `xcrun simctl openurl <uuid> <url>`. Call `DeviceInteractionSynthesize` with `activationBundleId: "com.apple.mobilesafari"` and no command to capture the UI hierarchy and screenshots. Wait for the intro to finish: the hierarchy must contain `Turn on audio experience` before interacting.
7. Derive coordinates from the latest hierarchy's bounds and `hitPoint` values, in points rather than screenshot pixels. Tap with `t <x> <y>`; swipe with `t <x1> <y1> f <x2> <y2> <seconds>`. `drag` is a long-press drag-and-drop, not a swipe; it can open Safari's text-selection loupe. Verify a tap by the Sound toggle changing to `Turn off audio experience`, then turn it off again. Swipe across the word and inspect the Panels bending; the single-screen piece is not expected to scroll. Capture during the gesture with `xcrun simctl io <uuid> screenshot <file>` if the Panels settle before the tool's post-gesture capture.
8. Call `DeviceInteractionEndSession` when finished, including on failure. Leave the user's Vite server running.

### Recovery: no supported devices

If session creation reports `None of the available devices are supported for Device Interaction` despite an available, supported runtime:

1. Check `xcrun devicectl device info details --device <uuid>` for the device's OS version, connection and HID capabilities. A selection failure is not evidence that taps or swipes are unsupported.
2. With no active interaction session, find the Xcode background service using `pgrep -fl 'Xcode Service.app/Contents/MacOS/Xcode Service'`. Terminate that specific PID with `kill -TERM <pid>`. This also disconnects the Xcode MCP bridge and interrupts other clients using that service; coordinate before restarting it.
3. Retry `DeviceInteractionStartSession`. Our MCP connection relaunched the service automatically on the next call; reconnect the Xcode MCP if your client does not. If the error persists, report the exact error instead of repeatedly restarting services.

Verified on Xcode 27.1 / iOS 27.0 / iPhone 18 Pro: the same session-start call failed before the service restart and succeeded afterward; native taps toggled Sound on/off and a swipe visibly Rustled Panels. The service had started before `simctl` repaired a CoreSimulator version mismatch. Restarting fixed the failure; the exact internal stale state was not established. This is an interaction smoke check, not an audio-quality or real-device performance test.

Tool-output redaction rewrites long digit runs, such as the LCG modulus 2³¹ − 1 written out. Write `2 ** 31 - 1`.
