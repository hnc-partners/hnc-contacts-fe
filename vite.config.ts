import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  // Production base URL for MF chunk resolution
  base: process.env.NODE_ENV === 'production'
    ? 'https://hncms-contacts-fe.scarif-0.duckdns.org/'
    : '/',
  plugins: [
    react(),
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
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5176,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
});
