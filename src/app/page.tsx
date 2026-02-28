import { getFeaturedBooks, getAllBooks } from "@/lib/books";
import { getAllArticles } from "@/lib/content";
import { categories } from "@/lib/categories";
import BookReviewCard from "@/components/books/BookReviewCard";
import ArticleCard from "@/components/articles/ArticleCard";
import Link from "next/link";

export default function HomePage() {
  const featuredBooks = getFeaturedBooks(10);
  const recentArticles = getAllArticles().slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      {/* Hero */}
      <section className="text-center py-12 sm:py-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
          Discover Your Next Great Read
        </h1>
        <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
          Honest book reviews with the best prices on Amazon India. Find
          great deals on the books that matter.
        </p>
        <div className="mt-6">
          <Link
            href="/books"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Browse All Books
          </Link>
        </div>
      </section>

      {/* Category chips */}
      <section className="flex gap-2 justify-center flex-wrap">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/books?category=${cat.slug}`}
            className="px-4 py-2 rounded-full text-sm font-medium bg-stone-100 text-muted hover:bg-stone-200 transition-colors"
          >
            {cat.name}
          </Link>
        ))}
      </section>

      {/* Featured books grid */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Featured Books
          </h2>
          <Link
            href="/books"
            className="text-sm text-primary font-medium hover:underline"
          >
            View all &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {featuredBooks.map((book) => (
            <BookReviewCard key={book.slug} book={book} />
          ))}
        </div>
      </section>

      {/* From the blog */}
      {recentArticles.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              From the Blog
            </h2>
            <Link
              href="/blog"
              className="text-sm text-primary font-medium hover:underline"
            >
              All posts &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
