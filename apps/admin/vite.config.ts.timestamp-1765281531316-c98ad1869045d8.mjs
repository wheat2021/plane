// vite.config.ts
import path from "node:path";
import * as dotenv from "file:///opt/code/plane/node_modules/.pnpm/@dotenvx+dotenvx@1.51.1/node_modules/@dotenvx/dotenvx/src/lib/main.js";
import { reactRouter } from "file:///opt/code/plane/node_modules/.pnpm/@react-router+dev@7.9.5_@react-router+serve@7.9.5_react-router@7.9.5_react-dom@18.3.1_r_543c67c2be6955d31e482497cdbbc4dc/node_modules/@react-router/dev/dist/vite.js";
import { defineConfig } from "file:///opt/code/plane/node_modules/.pnpm/vite@7.1.11_@types+node@22.12.0_jiti@2.6.1_terser@5.44.1_yaml@2.8.2/node_modules/vite/dist/node/index.js";
import tsconfigPaths from "file:///opt/code/plane/node_modules/.pnpm/vite-tsconfig-paths@5.1.4_typescript@5.8.3_vite@7.1.11_@types+node@22.12.0_jiti@2.6.1_terser@5.44.1_yaml@2.8.2_/node_modules/vite-tsconfig-paths/dist/index.js";
import { joinUrlPath } from "file:///opt/code/plane/packages/utils/dist/index.js";
var __vite_injected_original_dirname = "/opt/code/plane/apps/admin";
dotenv.config({ path: path.resolve(__vite_injected_original_dirname, ".env") });
var viteEnv = Object.keys(process.env).filter((k) => k.startsWith("VITE_")).reduce((a, k) => {
  a[k] = process.env[k] ?? "";
  return a;
}, {});
var basePath = joinUrlPath(process.env.VITE_ADMIN_BASE_PATH ?? "", "/") ?? "/";
var vite_config_default = defineConfig(() => ({
  base: basePath,
  define: {
    "process.env": JSON.stringify(viteEnv)
  },
  build: {
    assetsInlineLimit: 0
  },
  plugins: [reactRouter(), tsconfigPaths({ projects: [path.resolve(__vite_injected_original_dirname, "tsconfig.json")] })],
  resolve: {
    alias: {
      // Next.js compatibility shims used within admin
      "next/link": path.resolve(__vite_injected_original_dirname, "app/compat/next/link.tsx"),
      "next/navigation": path.resolve(__vite_injected_original_dirname, "app/compat/next/navigation.ts")
    },
    dedupe: ["react", "react-dom"]
  },
  server: {
    host: "127.0.0.1"
  }
  // No SSR-specific overrides needed; alias resolves to ESM build
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlUm9vdCI6ICJmaWxlOi8vL29wdC9jb2RlL3BsYW5lL2FwcHMvYWRtaW4vIiwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvb3B0L2NvZGUvcGxhbmUvYXBwcy9hZG1pblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL29wdC9jb2RlL3BsYW5lL2FwcHMvYWRtaW4vdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL29wdC9jb2RlL3BsYW5lL2FwcHMvYWRtaW4vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgKiBhcyBkb3RlbnYgZnJvbSBcIkBkb3RlbnZ4L2RvdGVudnhcIjtcbmltcG9ydCB7IHJlYWN0Um91dGVyIH0gZnJvbSBcIkByZWFjdC1yb3V0ZXIvZGV2L3ZpdGVcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tIFwidml0ZS10c2NvbmZpZy1wYXRoc1wiO1xuaW1wb3J0IHsgam9pblVybFBhdGggfSBmcm9tIFwiQHBsYW5lL3V0aWxzXCI7XG5cbmRvdGVudi5jb25maWcoeyBwYXRoOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi5lbnZcIikgfSk7XG5cbi8vIEV4cG9zZSBvbmx5IHZhcnMgc3RhcnRpbmcgd2l0aCBWSVRFX1xuY29uc3Qgdml0ZUVudiA9IE9iamVjdC5rZXlzKHByb2Nlc3MuZW52KVxuICAuZmlsdGVyKChrKSA9PiBrLnN0YXJ0c1dpdGgoXCJWSVRFX1wiKSlcbiAgLnJlZHVjZTxSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+PigoYSwgaykgPT4ge1xuICAgIGFba10gPSBwcm9jZXNzLmVudltrXSA/PyBcIlwiO1xuICAgIHJldHVybiBhO1xuICB9LCB7fSk7XG5cbmNvbnN0IGJhc2VQYXRoID0gam9pblVybFBhdGgocHJvY2Vzcy5lbnYuVklURV9BRE1JTl9CQVNFX1BBVEggPz8gXCJcIiwgXCIvXCIpID8/IFwiL1wiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKCkgPT4gKHtcbiAgYmFzZTogYmFzZVBhdGgsXG4gIGRlZmluZToge1xuICAgIFwicHJvY2Vzcy5lbnZcIjogSlNPTi5zdHJpbmdpZnkodml0ZUVudiksXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgYXNzZXRzSW5saW5lTGltaXQ6IDAsXG4gIH0sXG4gIHBsdWdpbnM6IFtyZWFjdFJvdXRlcigpLCB0c2NvbmZpZ1BhdGhzKHsgcHJvamVjdHM6IFtwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInRzY29uZmlnLmpzb25cIildIH0pXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAvLyBOZXh0LmpzIGNvbXBhdGliaWxpdHkgc2hpbXMgdXNlZCB3aXRoaW4gYWRtaW5cbiAgICAgIFwibmV4dC9saW5rXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiYXBwL2NvbXBhdC9uZXh0L2xpbmsudHN4XCIpLFxuICAgICAgXCJuZXh0L25hdmlnYXRpb25cIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJhcHAvY29tcGF0L25leHQvbmF2aWdhdGlvbi50c1wiKSxcbiAgICB9LFxuICAgIGRlZHVwZTogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIl0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiMTI3LjAuMC4xXCIsXG4gIH0sXG4gIC8vIE5vIFNTUi1zcGVjaWZpYyBvdmVycmlkZXMgbmVlZGVkOyBhbGlhcyByZXNvbHZlcyB0byBFU00gYnVpbGRcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ1EsT0FBTyxVQUFVO0FBQ2pSLFlBQVksWUFBWTtBQUN4QixTQUFTLG1CQUFtQjtBQUM1QixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLG1CQUFtQjtBQUMxQixTQUFTLG1CQUFtQjtBQUw1QixJQUFNLG1DQUFtQztBQU9sQyxjQUFPLEVBQUUsTUFBTSxLQUFLLFFBQVEsa0NBQVcsTUFBTSxFQUFFLENBQUM7QUFHdkQsSUFBTSxVQUFVLE9BQU8sS0FBSyxRQUFRLEdBQUcsRUFDcEMsT0FBTyxDQUFDLE1BQU0sRUFBRSxXQUFXLE9BQU8sQ0FBQyxFQUNuQyxPQUErQixDQUFDLEdBQUcsTUFBTTtBQUN4QyxJQUFFLENBQUMsSUFBSSxRQUFRLElBQUksQ0FBQyxLQUFLO0FBQ3pCLFNBQU87QUFDVCxHQUFHLENBQUMsQ0FBQztBQUVQLElBQU0sV0FBVyxZQUFZLFFBQVEsSUFBSSx3QkFBd0IsSUFBSSxHQUFHLEtBQUs7QUFFN0UsSUFBTyxzQkFBUSxhQUFhLE9BQU87QUFBQSxFQUNqQyxNQUFNO0FBQUEsRUFDTixRQUFRO0FBQUEsSUFDTixlQUFlLEtBQUssVUFBVSxPQUFPO0FBQUEsRUFDdkM7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLG1CQUFtQjtBQUFBLEVBQ3JCO0FBQUEsRUFDQSxTQUFTLENBQUMsWUFBWSxHQUFHLGNBQWMsRUFBRSxVQUFVLENBQUMsS0FBSyxRQUFRLGtDQUFXLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUFBLEVBQ2hHLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQTtBQUFBLE1BRUwsYUFBYSxLQUFLLFFBQVEsa0NBQVcsMEJBQTBCO0FBQUEsTUFDL0QsbUJBQW1CLEtBQUssUUFBUSxrQ0FBVywrQkFBK0I7QUFBQSxJQUM1RTtBQUFBLElBQ0EsUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLEVBQy9CO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBO0FBRUYsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
