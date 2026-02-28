import { Metadata } from "next";
import { getAllArticles } from "@/lib/content";
import { SITE_NAME } from "@/lib/constants";
import ArticleCard from "@/components/articles/ArticleCard";

export const metadata: Metadata = {
  title: `Blog | ${SITE_NAME}`,
  description:
    "Book recommendation lists, reading guides, and curated picks for Indian readers.",
};

export default function BlogPage() {
  const articles = getAllArticles();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Blog</h1>
      <p className="mt-2 text-lg text-muted">
        Book recommendation lists, reading guides, and curated picks.
      </p>

      {articles.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-center text-muted py-12">
          No blog posts yet. Check back soon!
        </p>
      )}
    </div>
  );
}
