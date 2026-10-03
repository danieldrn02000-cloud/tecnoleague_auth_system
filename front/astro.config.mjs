
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import netlify from "@astrojs/netlify";

export default defineConfig({
  output: "server",
  adapter: netlify(),
  integrations: [react()],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  vite: { plugins: [tailwindcss()] },
});