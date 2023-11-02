import {resolve} from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';
import vercelPlugin from 'vite-plugin-vercel';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'dist');

export default defineConfig({
  appType: 'mpa',
  root,
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        nested: resolve(root, 'game', 'index.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3322',
      },
    },
  },
  plugins: [vercelPlugin()],
  vercel: {
    rewrites: [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL}:path*`,
      },
    ],
  },
});
