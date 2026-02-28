import { BookFrontmatter, BookMeta } from "@/types/content";
import BookCover from "./BookCover";
import StarRating from "@/components/ui/StarRating";
import PriceCompare from "./PriceCompare";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BookReviewCard from "./BookReviewCard";
import { getCategoryBySlug } from "@/lib/categories";
import { ReactNode } from "react";

interface BookDetailProps {
  frontmatter: BookFrontmatter;
  content: ReactNode;
  relatedBooks: BookMeta[];
}

export default function BookDetail({
  frontmatter,
  content,
  relatedBooks,
}: BookDetailProps) {
  const category = getCategoryBySlug(frontmatter.category);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Books", href: "/books" },
          {
            label: category?.name || frontmatter.category,
            href: `/books?category=${frontmatter.category}`,
          },
          { label: frontmatter.title },
        ]}
      />

      {/* Hero: cover + meta side by side */}
      <div className="mt-6 flex flex-col sm:flex-row gap-8">
        <div className="flex-shrink-0 self-start">
          <BookCover
            isbn={frontmatter.isbn}
            title={frontmatter.title}
            author={frontmatter.author}
            coverImage={frontmatter.coverImage}
            size="lg"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
            {frontmatter.title}
          </h1>
          <p className="mt-2 text-lg text-muted">by {frontmatter.author}</p>
          <div className="mt-3">
            <StarRating rating={frontmatter.rating} />
          </div>
          <p className="mt-4 text-stone-600 leading-relaxed">
            {frontmatter.summary}
          </p>

          {/* Price comparison */}
          <div className="mt-6">
            <PriceCompare
              amazonUrl={frontmatter.amazonUrl}
              amazonPrice={frontmatter.amazonPrice}
            />
          </div>

          {/* Affiliate disclosure */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
            This page contains affiliate links. If you purchase through these
            links, we may earn a small commission at no extra cost to you.
          </div>
        </div>
      </div>

      {/* Tags */}
      {frontmatter.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {frontmatter.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-stone-100 text-stone-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Full review */}
      <div className="mt-10 prose">{content}</div>

      {/* Related books */}
      {relatedBooks.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedBooks.map((book) => (
              <BookReviewCard key={book.slug} book={book} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
