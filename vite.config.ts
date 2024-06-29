// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [],
  build: {
    rollupOptions: {
      input: ["src/content.ts", "src/popup.ts", "src/history.ts"],
      output: {
        entryFileNames: "[name].js",
        format: "esm",
      },
    },
  },
});
