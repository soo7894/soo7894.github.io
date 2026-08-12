import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const pagesRoot = fileURLToPath(new URL("./github-pages", import.meta.url));

export default defineConfig({
  root: pagesRoot,
  base: "/",
  envDir: projectRoot,
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("./pages-dist", import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL("./github-pages/index.html", import.meta.url)),
        admin: fileURLToPath(new URL("./github-pages/admin/index.html", import.meta.url)),
      },
    },
  },
});
