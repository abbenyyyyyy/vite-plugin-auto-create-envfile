import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.js"),
      name: "vite-plugin-auto-create-envfile",
      fileName: (format) => `index.${format}.js`,
    },
  },
});
