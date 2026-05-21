import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules/')) return undefined;

            // React Router — no circular deps, purely route handling
            if (id.includes('node_modules/react-router')) {
              return 'vendor-router';
            }
            // Lucide icons — pure ESM, no React peer dep issues
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            // SweetAlert2 — standalone
            if (id.includes('node_modules/sweetalert2')) {
              return 'vendor-swal';
            }
            // Animation — standalone large lib
            if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) {
              return 'vendor-motion';
            }
            // React core + everything else in one stable vendor chunk
            // (avoids circular deps from react-dom ↔ misc cross-imports)
            return 'vendor';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
  };
});
