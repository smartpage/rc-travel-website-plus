import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    watch: {
      // Prevent full page reloads when backend writes design snapshot files
      ignored: [
        '**/dbV2.json',
        '**/dbV2.backup-*.json'
      ]
    },
    proxy: {
      '/design-api': {
        target: 'http://localhost:4010',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/design-api/, ''),
        secure: false,
      },
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
