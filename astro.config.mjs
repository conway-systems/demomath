// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import pagefind from 'astro-pagefind';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [pagefind()],

  markdown: {
      processor: unified({
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex]
      })
  },

  vite: {
    plugins: [tailwindcss()],
  },
});