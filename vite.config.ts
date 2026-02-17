import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = (env.CR_API_KEY || env.VITE_CR_API_KEY || '').replace(/\s+/g, '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'https://proxy.royaleapi.dev/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          ...(apiKey
            ? {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              }
            : {}),
        },
      },
    },
  };
})
