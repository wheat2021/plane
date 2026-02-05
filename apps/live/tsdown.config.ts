import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/start.ts"],
  outDir: "dist",
  format: ["esm"],
  dts: false,
  clean: !process.argv.includes("--watch"),
  sourcemap: false,
  exports: true,
});
