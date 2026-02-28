import { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/content";
import { getAllBooks } from "@/lib/books";
import { categories } from "@/lib/categories";
import { SITE_URL } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();
  const books = getAllBooks();

  // Book entries (primary content — highest priority)
  const bookEntries = books.map((b) => ({
    url: `${SITE_URL}/books/${b.slug}`,
    lastModified: new Date(b.frontmatter.date),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  // Blog entries (articles)
  const blogEntries = articles.map((a) => ({
    url: `${SITE_URL}/blog/${a.slug}`,
    lastModified: new Date(a.frontmatter.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Category entries
  const categoryEntries = categories.map((cat) => ({
    url: `${SITE_URL}/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/books`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...bookEntries,
    ...blogEntries,
    ...categoryEntries,
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];
}
