import { NextResponse } from "next/server";
import { getAllBooks } from "@/lib/books";
import { SearchableBook } from "@/types/search";

export const dynamic = "force-static";

export async function GET() {
  const books = getAllBooks();
  const index: SearchableBook[] = books.map((b) => ({
    slug: b.slug,
    title: b.frontmatter.title,
    author: b.frontmatter.author,
    isbn: b.frontmatter.isbn,
    category: b.frontmatter.category,
    rating: b.frontmatter.rating,
    coverImage: b.frontmatter.coverImage,
    tags: b.frontmatter.tags,
  }));
  return NextResponse.json(index);
}
