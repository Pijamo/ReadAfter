"use client";

import { useState } from "react";
import { BookMeta } from "@/types/content";
import { categories } from "@/lib/categories";
import BookReviewCard from "./BookReviewCard";

export default function BooksPageClient({ books }: { books: BookMeta[] }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? books
      : books.filter((b) => b.frontmatter.category === activeCategory);

  return (
    <>
      {/* Category filter chips */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeCategory === "all"
              ? "bg-primary text-white"
              : "bg-stone-100 text-muted hover:bg-stone-200"
          }`}
        >
          All Books
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setActiveCategory(cat.slug)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.slug
                ? "bg-primary text-white"
                : "bg-stone-100 text-muted hover:bg-stone-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Book grid */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map((book) => (
          <BookReviewCard key={book.slug} book={book} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-muted py-12">
          No books found in this category yet. Check back soon!
        </p>
      )}
    </>
  );
}
