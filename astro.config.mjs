// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { toString as mdastToString } from 'mdast-util-to-string';

const SPANISH_WPM = 220;

function remarkReadingTime() {
  return (tree, { data }) => {
    const text = mdastToString(tree);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.round(wordCount / SPANISH_WPM));
    data.astro.frontmatter.wordCount = wordCount;
    data.astro.frontmatter.readingTimeMinutes = readingTimeMinutes;
  };
}

export default defineConfig({
  site: 'https://mx.beeghee.energy',
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: { plugins: [tailwindcss()] },
  integrations: [mdx(), sitemap(), react()],
  markdown: {
    remarkPlugins: [remarkReadingTime],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { className: ['heading-anchor'] } }],
    ],
  },
});
