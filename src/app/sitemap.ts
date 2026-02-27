import { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/content";
import { categories } from "@/lib/categories";
import { SITE_URL } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();

  const articleEntries = articles.map((a) => ({
    url: `${SITE_URL}/${a.frontmatter.category}/${a.slug}`,
    lastModified: new Date(a.frontmatter.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const categoryEntries = categories.map((cat) => ({
    url: `${SITE_URL}/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...categoryEntries,
    ...articleEntries,
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
