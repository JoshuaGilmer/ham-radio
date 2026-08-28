import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// singlefile: the production build emits ONE self-contained dist/index.html,
// which is what gets published as the shareable demo link.
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: { "@": path.resolve(dirname, "./src") },
  },
});
