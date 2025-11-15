// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://web-converter-ten.vercel.app',

  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: 'lightningcss',
      minify: 'esbuild', // Use esbuild for minification (faster and built-in)
    }
  },

  adapter: vercel({
    webAnalytics: {
      enabled: true
    },
    speedInsights: {
      enabled: true
    },
    imageService: true,
    isr: {
      expiration: 60 * 60 * 24 // 24 hours cache
    }
  }),

  compressHTML: true,
  build: {
    inlineStylesheets: 'auto'
  },

  // SEO and Performance optimizations
  trailingSlash: 'never',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport'
  }
});