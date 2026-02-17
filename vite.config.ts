import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

// Plugin to bundle content and background scripts as IIFE after main build
function bundleExtensionScripts() {
  return {
    name: 'bundle-extension-scripts',
    closeBundle: async () => {
      const { build } = await import('esbuild');
      const srcPath = resolve(__dirname, 'src');
      
      // Bundle content script
      await build({
        entryPoints: ['src/content/index.tsx'],
        bundle: true,
        format: 'iife',
        outfile: 'dist/content.js',
        minify: true,
        jsx: 'automatic',
        jsxImportSource: 'react',
        define: {
          'process.env.NODE_ENV': '"production"',
        },
        alias: {
          '@': srcPath,
        },
        external: [],
      });
      
      // Bundle background script
      await build({
        entryPoints: ['src/background/index.ts'],
        bundle: true,
        format: 'iife',
        outfile: 'dist/background.js',
        minify: true,
        define: {
          'process.env.NODE_ENV': '"production"',
        },
        alias: {
          '@': srcPath,
        },
        external: [],
      });
     
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    bundleExtensionScripts(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
