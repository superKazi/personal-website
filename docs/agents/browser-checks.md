# Browser checks

Checking the piece in the Chrome DevTools MCP. Run every check against a fresh server and a fresh tab.

## Setup

1. Start your own server: `pnpm exec vite --port 5199 --strictPort > /tmp/vite.log 2>&1 &`. `--strictPort` fails loudly if the port is taken, instead of drifting to 5200. Leave the user's own `vite --host` server running.
2. Wait until `curl -s -o /dev/null -w "%{http_code}" "http://[::1]:5199/"` prints `200`. Vite listens on IPv6 only, and IP literals get redacted in tool calls, so use `[::1]` for curl and `localhost` in Chrome.
3. Open a **fresh tab** with `new_page({ url: "about:blank" })`, then `navigate_page({ pageId, url: "http://localhost:5199/", initScript })`. Existing tabs go stale after a server restart and report "connection refused".
4. Wait about 4 s for the intro. The Sound toggle stays out of the accessibility tree until the intro ends, so look for `button "Turn on audio experience"` in a snapshot before clicking it. Hide the dev gui first: `document.querySelector('.lil-gui').style.display = 'none'`. It covers the toggle.
5. Keep files untouched while a check runs: any save reloads the page through HMR, mid-test.
6. When done, stop your server (`pkill -f "vite --port 5199"`) and close your tabs.

## Snippets

Synthetic swipe along the word's diagonal at 1280×800 (`k` from 0 to 1):

```js
const c = document.querySelector("canvas");
const fire = (type, x, y) =>
  c.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerType: "mouse", bubbles: true }));
fire("pointerenter", 300, 620);
for (let i = 0; i <= 30; i++) {
  const k = i / 30;
  fire("pointermove", 300 + k * 650, 620 - k * 440);
  await new Promise((r) => setTimeout(r, 16));
}
c.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse", bubbles: true }));
```

Gap-free output tap, as an `initScript`: it records the peak, the largest sample-to-sample jump, and click counts on everything reaching the speakers.

```js
(() => {
  const a = (window.__a = { peak: 0, jump: 0, clicks: 0 });
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    if (dest instanceof AudioDestinationNode && !this.context.__tap) {
      const ctx = this.context;
      ctx.__tap = true;
      const tap = ctx.createScriptProcessor(1024, 2, 2);
      let prev = 0;
      tap.onaudioprocess = (e) => {
        for (const v of e.inputBuffer.getChannelData(0)) {
          const j = Math.abs(v - prev);
          prev = v;
          a.jump = Math.max(a.jump, j);
          if (j > 0.03) a.clicks++;
          a.peak = Math.max(a.peak, Math.abs(v));
        }
      };
      connect.call(this, tap);
      const mute = ctx.createGain();
      mute.gain.value = 0;
      tap.connect(mute).connect(ctx.destination);
    }
    return connect.call(this, dest, ...rest);
  };
})();
```

Reduced motion: the MCP can't emulate it. Use an `initScript` that replaces `window.matchMedia` for `prefers-reduced-motion` queries, with a `window.__setReduced(bool)` switch that fires the stored listeners.

## When the user's ear disagrees

Synthetic pointer events don't reproduce real hand input: hands jiggle, move slowly, and retrigger the same Panels. When the user hears a problem your measurements miss, trust the ear. Before changing code, have the user bisect with the existing lil-gui sliders, one setting at a time. That found the crackle (the Chime `knock`) in one round, after three misleading measurements.
