import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Use 'generateSW' strategy — vite-plugin-pwa generates the SW for us.
      // We only cache the app shell and static assets.
      // Patient/scan/appointment data belongs in IndexedDB, NOT in the SW cache.
      strategies: "generateSW",
      registerType: "autoUpdate",
      injectRegister: "inline",

      // Manifest is in public/manifest.json — don't generate a duplicate
      manifest: false,

      workbox: {
        // Cache the app shell and all built static assets (JS, CSS, fonts, icons)
        globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2,ico}"],

        // Navigation fallback: when offline and navigating any route,
        // serve the cached index.html so HashRouter can take over
        navigateFallback: "/Drishti-AI/index.html",
        navigateFallbackDenylist: [/\/api\//],

        // Runtime caching strategies
        runtimeCaching: [
          {
            // Google Fonts — cache-first so they work offline after first visit
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "drishti-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Backend health check / API — network only, never cache
            // Clinical data must never be served stale from a cache
            urlPattern: /\/api\//,
            handler: "NetworkOnly",
          },
        ],

        // Claim clients immediately so the SW activates without waiting for reload
        clientsClaim: true,
        skipWaiting: true,

        // Clean up old caches from previous SW versions
        cleanupOutdatedCaches: true,
      },

      devOptions: {
        // Enable SW in dev mode for testing offline behaviour
        enabled: false, // Keep disabled in dev to avoid confusion; enable if explicitly testing SW
        type: "module",
      },
    }),
  ],

  base: "/Drishti-AI/",

  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": "http://localhost:5000",
      "/uploads": "http://localhost:5000",
    },
  },

  build: {
    // Source maps for debugging in production
    sourcemap: false,
    // Split large chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["recharts", "d3"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
});
