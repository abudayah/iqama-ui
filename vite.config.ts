import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin } from 'vite';

/**
 * Builds a Content-Security-Policy string scoped to the configured API host.
 * Falls back to 'self' only when no API URL is set.
 */
function buildCsp(apiBaseUrl: string): string {
  // Extract just the origin (scheme + host + port) from the full URL
  let apiOrigin = "'self'";
  if (apiBaseUrl) {
    try {
      apiOrigin = new URL(apiBaseUrl).origin;
    } catch {
      // malformed URL — fall back to self
    }
  }

  return [
    "default-src 'self'",
    `connect-src 'self' ${apiOrigin}`,
    "script-src 'self' 'unsafe-inline'",   // unsafe-inline needed for Vite HMR in dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "worker-src 'self' blob:",             // service worker
    "manifest-src 'self'",
  ].join('; ');
}

/** Injects a <meta http-equiv="Content-Security-Policy"> into the built HTML. */
function cspPlugin(apiBaseUrl: string): Plugin {
  const csp = buildCsp(apiBaseUrl);
  return {
    name: 'inject-csp',
    // Dev: add CSP as a response header so the browser enforces it during development
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Content-Security-Policy', csp);
        next();
      });
    },
    // Build: inject a <meta> tag into the generated HTML
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
      );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env['VITE_API_BASE_URL'] ?? '';

  return {
    base: '/ui/',
    plugins: [
      react(),
      cspPlugin(apiBaseUrl),
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'generateSW',
        // Manifest is handled dynamically in index.html via useFavicon hook
        // so the public app gets /favicon/site.webmanifest and admin gets /favicon-admin/site.webmanifest
        manifest: false,
        workbox: {
          runtimeCaching: [],
        },
      }),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
      },
    },
  };
});
