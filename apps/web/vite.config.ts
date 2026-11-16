import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "canonical-inter-license",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "inter-license.txt",
          source: readFileSync(
            new URL("../../docs/GUI/assets/inter-license.txt", import.meta.url),
            "utf8",
          ),
        });
      },
    },
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { host: "127.0.0.1" },
});
