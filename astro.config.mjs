import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://pijamo.github.io',
  base: '/ReadAfter',
  integrations: [tailwind(), sitemap()],
  output: 'static',
});
