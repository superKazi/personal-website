// Live audio check: Rustles the real page in each engine and fails on engine-specific Chime bugs.
//   loud:  any output block peaking over MAX_PEAK (WebKit played voices ~16x too loud at default gain 1)
//   buzz:  energy above 4.5 kHz over MAX_HIGH_DB (Firefox buzzed when Chimes were scheduled in the past)
// Chimes have almost nothing above 4.5 kHz, so the buzz stands out there even ~56 dB down.
// Usage: pnpm run audio-check [webkit,firefox,chromium]
import { chromium, firefox, webkit } from "playwright";
import { createServer } from "vite";

const MAX_PEAK = 0.5;
const MAX_HIGH_DB = -70;

/**
 * Records everything reaching the speakers from an AudioWorklet, on the audio thread, so a busy
 * main thread can't drop samples (a ScriptProcessor tap loses blocks, and the seams read as buzz).
 * Runs in the page before any app code.
 */
const tap = () => {
  const s = (window.__audioCheck = { blocks: [], running: false });
  const code = `registerProcessor("tap", class extends AudioWorkletProcessor {
    buf = new Float32Array(1024);
    n = 0;
    process([input]) {
      for (const v of input[0] ?? []) {
        this.buf[this.n++] = v;
        if (this.n === this.buf.length) {
          this.port.postMessage(this.buf, [this.buf.buffer]);
          this.buf = new Float32Array(1024);
          this.n = 0;
        }
      }
      return true;
    }
  });`;
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    if (dest instanceof AudioDestinationNode && !this.context.__tapped) {
      const ctx = this.context;
      const source = this;
      ctx.__tapped = true;
      const url = URL.createObjectURL(
        new Blob([code], { type: "text/javascript" }),
      );
      void ctx.audioWorklet.addModule(url).then(() => {
        const node = new AudioWorkletNode(ctx, "tap");
        node.port.onmessage = (e) => {
          s.running = ctx.state === "running";
          s.rate = ctx.sampleRate;
          if (s.blocks.length < 560) s.blocks.push(e.data);
        };
        connect.call(source, node);
        const mute = ctx.createGain();
        mute.gain.value = 0;
        connect.call(node, mute);
        connect.call(mute, ctx.destination);
      });
    }
    return connect.call(this, dest, ...rest);
  };
};

const fft = (re, im) => {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len)
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(a * k),
          wi = Math.sin(a * k);
        const p = i + k + len / 2;
        const xr = re[p] * wr - im[p] * wi,
          xi = re[p] * wi + im[p] * wr;
        re[p] = re[i + k] - xr;
        im[p] = im[i + k] - xi;
        re[i + k] += xr;
        im[i + k] += xi;
      }
  }
};

/**
 * Energy above 4.5 kHz relative to the whole signal, in dB (Hann-windowed average spectrum).
 */
const highDb = (x, rate) => {
  const N = 4096;
  const power = new Float64Array(N / 2);
  for (let s = 0; s + N <= x.length; s += N / 2) {
    const re = new Float64Array(N),
      im = new Float64Array(N);
    for (let i = 0; i < N; i++)
      re[i] = x[s + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
    fft(re, im);
    for (let k = 0; k < N / 2; k++) power[k] += re[k] * re[k] + im[k] * im[k];
  }
  const total = power.reduce((a, b) => a + b, 0);
  const high = power
    .slice(Math.ceil((4500 * N) / rate))
    .reduce((a, b) => a + b, 0);
  return 10 * Math.log10(high / total);
};

const check = async (engine, name, url) => {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    });
    await page.addInitScript(tap);
    await page.goto(url);
    const toggle = page.getByRole("button", {
      name: "Turn on audio experience",
    });
    await toggle.waitFor({ timeout: 20000 });
    // the dev gui covers the Sound toggle
    await page.evaluate(() =>
      document.querySelector(".lil-gui")?.style.setProperty("display", "none"),
    );
    await toggle.click();
    // a jittery hand Rustling back and forth along the word for ~12 s, seeded so every run is the same
    let seed = 5;
    const rnd = () => (seed = (seed * 16807) % (2 ** 31 - 1)) / (2 ** 31 - 1);
    let k = 0.45,
      dir = 1,
      speed = 0.012;
    for (let i = 0; i < 750; i++) {
      if (rnd() < 0.05) dir = -dir;
      if (rnd() < 0.05) speed = 0.004 + rnd() * 0.025;
      k = Math.min(0.95, Math.max(0.05, k + dir * speed));
      if (k === 0.95 || k === 0.05) dir = -dir;
      await page.mouse.move(
        300 + k * 650 + (rnd() - 0.5) * 6,
        620 - k * 440 + (rnd() - 0.5) * 30,
      );
      await page.waitForTimeout(8 + rnd() * 12);
    }
    await page.waitForTimeout(500);
    const { running, rate, blocks } = await page.evaluate(() => {
      const { running, rate, blocks } = window.__audioCheck;
      return {
        running,
        rate,
        blocks: blocks.map((b) => Array.from(b)),
      };
    });
    // a silent or suspended context would pass every check, so it fails instead
    if (!running || blocks.length < 100)
      return {
        name,
        ok: false,
        reason: `audio never ran (${blocks.length} blocks)`,
      };
    const x = Float32Array.from(blocks.flat());
    const peak = x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    if (peak < 0.01)
      return { name, ok: false, reason: "no Chimes reached the output" };
    const high = highDb(x, rate);
    const failures = [
      peak > MAX_PEAK && `loud: peak ${peak.toFixed(3)} > ${MAX_PEAK}`,
      // NaN would slip past a plain comparison
      !(high <= MAX_HIGH_DB) &&
        `buzz: ${high.toFixed(1)} dB above 4.5 kHz > ${MAX_HIGH_DB} dB`,
    ].filter(Boolean);
    return {
      name,
      ok: !failures.length,
      reason:
        failures.join("; ") ||
        `peak ${peak.toFixed(3)}, ${high.toFixed(1)} dB above 4.5 kHz`,
    };
  } finally {
    await browser.close();
  }
};

const engines = { webkit, firefox, chromium };
const names = (process.argv[2] ?? "webkit,firefox,chromium").split(",");
const server = await createServer({
  logLevel: "error",
  server: { port: 5190 },
});
await server.listen();
const url = server.resolvedUrls.local[0];
const results = [];
try {
  for (const name of names) {
    const result = await check(engines[name], name, url).catch((e) => ({
      name,
      ok: false,
      reason: String(e).split("\n")[0],
    }));
    console.log(`${result.ok ? "pass" : "FAIL"} ${name}: ${result.reason}`);
    results.push(result);
  }
} finally {
  await server.close();
}
process.exitCode = results.every((r) => r.ok) ? 0 : 1;
