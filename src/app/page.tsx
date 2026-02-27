import { getAllArticles, getFeaturedArticles } from "@/lib/content";
import { categories } from "@/lib/categories";
import ArticleCard from "@/components/articles/ArticleCard";
import Link from "next/link";

export default function HomePage() {
  const featured = getFeaturedArticles(3);
  const recent = getAllArticles().slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      {/* Hero */}
      <section className="text-center py-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
          Find Your Next Great Read
        </h1>
        <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
          Curated book recommendations for Indian readers. Compare prices across
          Amazon India and Flipkart to get the best deals.
        </p>
      </section>

      {/* Featured articles */}
      {featured.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Featured Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Browse by Category
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${cat.slug}`}
              className="border border-border rounded-xl bg-card p-5 hover:shadow-md hover:border-primary/30 transition-all"
            >
              <h3 className="text-lg font-semibold text-foreground">
                {cat.name}
              </h3>
              <p className="mt-1 text-sm text-muted">{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent articles */}
      {recent.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Latest Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recent.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
