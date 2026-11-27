import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/** Hash routes work without this; 404.html also covers non-hash deep links on Pages. */
function githubPagesFallback() {
  return {
    name: "gh-pages-404",
    closeBundle() {
      const dist = resolve(__dirname, "dist");
      copyFileSync(resolve(dist, "index.html"), resolve(dist, "404.html"));
    },
  };
}

export default defineConfig({
  base: "/mishakim-yachad/",
  plugins: [react(), githubPagesFallback()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
