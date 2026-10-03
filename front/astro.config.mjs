import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [react()],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  vite: { plugins: [tailwindcss()] },
});