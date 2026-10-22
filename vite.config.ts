// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import JavaScriptObfuscator from "javascript-obfuscator";
import type { Plugin } from "vite";

// Obfuscates browser (client) bundles at build time only.
// Dev mode and the server bundle are left untouched.
function obfuscateClient(): Plugin {
  return {
    name: "obfuscate-client",
    apply: "build",
    enforce: "post",
    generateBundle(_opts, bundle) {
      if (this.environment?.name !== "client") return;
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== "chunk" || !fileName.endsWith(".js")) continue;
        chunk.code = JavaScriptObfuscator.obfuscate(chunk.code, {
          compact: true,
          identifierNamesGenerator: "hexadecimal",
          renameGlobals: false,
          stringArray: true,
          stringArrayEncoding: ["base64"],
          stringArrayThreshold: 0.75,
          splitStrings: true,
          splitStringsChunkLength: 10,
          unicodeEscapeSequence: false,
        }).getObfuscatedCode();
      }
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [obfuscateClient()],
  },
});
