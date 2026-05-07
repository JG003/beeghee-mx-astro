import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Sveltia CMS serialises empty lists / cleared optional fields as the bare YAML
// key (e.g. `tags:`), which parses to `null`. Coerce null → [] / undefined so a
// CMS save that empties a list doesn't break the build.
const optionalStringList = z.preprocess(
  (v) => (v == null ? [] : v),
  z.array(z.string()),
).optional();
const optionalString = z.preprocess(
  (v) => (v == null ? undefined : v),
  z.string().optional(),
);
const optionalDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string(),
);

const articleFields = z.object({
  title: z.string(),
  subtitle: optionalString,
  slug: z.string(),
  publishedAt: optionalDate,
  excerpt: z.string(),
  hero: z.string(),
  heroAlt: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  ogImage: z.string(),
  hreflangEn: optionalString,
  tags: optionalStringList,
  relatedSlugs: optionalStringList,
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
