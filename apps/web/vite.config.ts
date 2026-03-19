import path from "node:path";
import * as dotenv from "@dotenvx/dotenvx";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

dotenv.config({ path: path.resolve(__dirname, ".env") });

// Expose only vars starting with VITE_
const viteEnv = Object.keys(process.env)
  .filter((k) => k.startsWith("VITE_"))
  .reduce<Record<string, string>>((a, k) => {
    a[k] = process.env[k] ?? "";
    return a;
  }, {});

// Dev defaults for vars no longer in .env (keep .env minimal)
const viteDefaults: Record<string, string> = {
  VITE_WEB_BASE_URL: "http://localhost:3000",
  VITE_ADMIN_BASE_URL: "http://localhost:3001",
  VITE_ADMIN_BASE_PATH: "/god-mode",
  VITE_SPACE_BASE_URL: "http://localhost:3002",
  VITE_SPACE_BASE_PATH: "/spaces",
  VITE_LIVE_BASE_URL: "http://localhost:3100",
  VITE_LIVE_BASE_PATH: "/live",
};
const mergedViteEnv = { ...viteDefaults, ...viteEnv };

export default defineConfig(() => ({
  define: {
    "process.env": JSON.stringify(mergedViteEnv),
  },
  build: {
    assetsInlineLimit: 0,
  },
  plugins: [reactRouter(), tsconfigPaths({ projects: [path.resolve(__dirname, "tsconfig.json")] })],
  resolve: {
    alias: {
      // Next.js compatibility shims used within web
      "next/link": path.resolve(__dirname, "app/compat/next/link.tsx"),
      "next/navigation": path.resolve(__dirname, "app/compat/next/navigation.ts"),
      "next/script": path.resolve(__dirname, "app/compat/next/script.tsx"),
    },
    dedupe: ["react", "react-dom", "@headlessui/react"],
  },
  server: {
    host: "127.0.0.1",
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
      "/auth": { target: "http://localhost:8000", changeOrigin: true },
      "/uploads": { target: "http://localhost:8000", changeOrigin: true },
      "/media": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
  // No SSR-specific overrides needed; alias resolves to ESM build
}));
