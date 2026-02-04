import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { federation } from '@module-federation/vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';

const isProduction = process.env.NODE_ENV === 'production';

// https://vite.dev/config/
export default defineConfig({
  // Production base URL for MF chunk resolution
  base: isProduction
    ? 'https://hncms-contacts-fe.scarif-0.duckdns.org/'
    : '/',
  plugins: [
    TanStackRouterVite(),
    react(),
    // Only enable Module Federation for production builds
    // In dev mode, run as standalone app (faster, simpler)
    ...(isProduction ? [
      federation({
        name: 'contacts',
        filename: 'remoteEntry.js',
        exposes: {
          './App': './src/App.tsx',
          './ContactsPage': './src/features/contacts/components/ContactsPage.tsx',
        },
        // Shared dependencies - singleton ensures single instance across MF boundary
        shared: {
          react: { singleton: true, requiredVersion: '^19.0.0' },
          'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
          // NOTE: @tanstack/react-router removed - ContactsPage uses shell's router
          '@tanstack/react-query': { singleton: true, requiredVersion: '^5.62.0' },
          '@hnc-partners/auth-context': { singleton: true, requiredVersion: '^0.1.0' },
        },
      }),
      // Inject CSS into JS for Module Federation (CSS files don't load cross-origin)
      cssInjectedByJsPlugin({
        jsAssetsFilterFunction: (outputChunk) =>
          outputChunk.fileName === 'remoteEntry.js',
      }),
    ] : []),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5175,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Inject dev API key for local development
        headers: {
          'x-api-key': 'dev-api-key-change-in-production',
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: !isProduction, // Sourcemaps only in dev
    target: 'esnext',
    minify: isProduction,     // Minify in production (esbuild)
    cssCodeSplit: false,
    assetsInlineLimit: 0,     // Ensure assets load correctly in MF environments
  },
});
