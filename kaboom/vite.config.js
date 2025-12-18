import { defineConfig } from "vite";

export default defineConfig({
  base: "/static/kaboom/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: "terser",
  },
});
