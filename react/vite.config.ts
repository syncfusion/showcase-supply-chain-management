import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/supply-chain/react/',
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      ignored: ['**/dist.zip'],
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          const syncfusionPackage = id.match(/node_modules\/@syncfusion\/([^/]+)/)?.[1];
          if (syncfusionPackage) {
            // Keep each Syncfusion package independently cacheable and avoid
            // sending one large component bundle through the load balancer.
            return `syncfusion-${syncfusionPackage}`;
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          return undefined;
        }
      }
    }
  }
})
