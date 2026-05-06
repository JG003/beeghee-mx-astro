import { getCollection, type CollectionEntry } from 'astro:content';

export type ArticleSection = 'blog' | 'aprende';

export type ArticleEntry = CollectionEntry<'blog'> | CollectionEntry<'aprende'>;

function byDateDesc(a: ArticleEntry, b: ArticleEntry) {
  return b.data.publishedAt.localeCompare(a.data.publishedAt);
}

export async function getSectionArticles(section: ArticleSection): Promise<ArticleEntry[]> {
  const entries = await getCollection(section);
  return entries.slice().sort(byDateDesc);
}

export async function getRelatedArticles(
  article: ArticleEntry,
  limit = 3,
): Promise<ArticleEntry[]> {
  const same = await getSectionArticles(article.data.section);
  const others = same.filter((a) => a.data.slug !== article.data.slug);
  const explicit = (article.data.relatedSlugs ?? [])
    .map((slug) => others.find((a) => a.data.slug === slug))
    .filter((a): a is ArticleEntry => Boolean(a));
  const fillers = others.filter((a) => !explicit.includes(a));
  return [...explicit, ...fillers].slice(0, limit);
}

export function articleHref(entry: ArticleEntry): string {
  return `/${entry.data.section}/${entry.data.slug}/`;
}

export function formatSpanishDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
