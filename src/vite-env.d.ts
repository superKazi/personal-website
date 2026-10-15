/// <reference types="vite/client" />

// set by GoatCounter's count.js; absent until it loads or when blocked
// eslint-disable-next-line no-var -- only var declarations appear on globalThis
declare var goatcounter:
  | { count: (vars: Readonly<{ path: string; event: boolean }>) => void }
  | undefined;
