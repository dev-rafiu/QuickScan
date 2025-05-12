import * as fs from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const manifestForPlugin = {
  registerType: "autoUpdate" as const,
  devOptions: {
    enabled: true,
  },
  includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
  manifest: {
    name: "QuickScan",
    short_name: "QuickScan",
    description:
      "Instantly scan and decode barcodes or QR codes from your browser—no app store needed",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone" as const,
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA(manifestForPlugin)],
  server: {
    port: 5174,
    https: {
      key: fs.readFileSync("./certs/localhost-key.pem"),
      cert: fs.readFileSync("./certs/localhost.pem"),
    },
  },
});
