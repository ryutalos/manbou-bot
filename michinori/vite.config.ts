import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// 相対パスで配信できるように base:"./"(GitHub Pages等のサブパス配信にも耐える)
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "ミチノリ",
        short_name: "ミチノリ",
        description: "旅の計画を、時間からデザインする。",
        lang: "ja",
        theme_color: "#2000FF",
        background_color: "#F3F5FC",
        display: "standalone",
        orientation: "portrait",
        // アイコンはSVG1枚で兼用(バイナリ資産を持たない構成)。
        // 高精細なPNGアイコンが必要になったら public/ に追加して差し替える。
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
      },
    }),
  ],
});
