import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

export default defineConfig({
  plugins: [vue()],
  build: {
    // Library mode lets us control output format and file name. :contentReference[oaicite:12]{index=12}
    lib: {
      entry: path.resolve(__dirname, "src/main.ts"),
      formats: ["cjs"],
      fileName: () => "main.js"
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    target: "es2020",
    rollupOptions: {
      // Obsidian provides these at runtime; don't bundle them.
      // Also keep it CommonJS-friendly to avoid runtime "obsidian" issues. :contentReference[oaicite:13]{index=13}
      external: ["obsidian", "electron"],
      output: {
        inlineDynamicImports: true,
        // Make the CJS export be the plugin class directly (nice for Obsidian loaders).
        exports: "default"
      }
    }
  }
});
