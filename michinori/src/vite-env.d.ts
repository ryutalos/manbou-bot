/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

import type { KVStorage } from "./lib/storage";

declare global {
  interface Window {
    // モック由来のコードが参照する永続化ハンドル。main.tsx で IndexedDB 実装を注入する。
    storage?: KVStorage;
  }
}

// PNG などアセットを import できるように
declare module "*.png" {
  const src: string;
  export default src;
}
