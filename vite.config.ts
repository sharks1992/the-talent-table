import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  // No hardcoded port: `npm run dev -- --port N --host H` is forwarded by Vite.
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});