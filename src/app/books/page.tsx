import { Metadata } from "next";
import { getAllBooks } from "@/lib/books";
import { SITE_NAME } from "@/lib/constants";
import BooksPageClient from "@/components/books/BooksPageClient";

export const metadata: Metadata = {
  title: `Browse Books | ${SITE_NAME}`,
  description:
    "Browse our curated collection of the best self-help, business, and personal finance books with the best prices on Amazon India.",
};

export default function BooksPage() {
  const books = getAllBooks();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
        Browse Books
      </h1>
      <p className="mt-2 text-lg text-muted">
        Curated book recommendations with honest reviews and price comparison.
      </p>

      <BooksPageClient books={books} />
    </div>
  );
}
