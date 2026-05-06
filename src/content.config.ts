import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articleFields = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  slug: z.string(),
  publishedAt: z.string(),
  excerpt: z.string(),
  hero: z.string(),
  heroAlt: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  ogImage: z.string(),
  hreflangEn: z.string().optional(),
  tags: z.array(z.string()).optional(),
  relatedSlugs: z.array(z.string()).optional(),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: articleFields.extend({ section: z.literal('blog') }),
});

const aprende = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/aprende' }),
  schema: articleFields.extend({ section: z.literal('aprende') }),
});

export const collections = { blog, aprende };
