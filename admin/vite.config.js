import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isStandalone = process.env.VERCEL || process.env.VITE_BASE_URL === '/' || process.env.STANDALONE;
  const base = process.env.VITE_BASE_URL || (command === 'serve' || isStandalone ? '/' : '/admin/');
  return {
    base,
    plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'esnext',
    cssMinify: true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('qrcode')) return 'vendor-qr';
          }
        }
      }
    }
  }
};
});
