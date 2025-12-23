import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/main.ts"),
      formats: ["cjs"],
      fileName: () => "main.js",
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    target: "es2020",
    rollupOptions: {
      external: [
        "obsidian",
        "electron",
        "@codemirror/state",
        "@codemirror/view",
        "@codemirror/language"
      ],
      output: {
        inlineDynamicImports: true,
        exports: "default",
      },
    },
  },
});
