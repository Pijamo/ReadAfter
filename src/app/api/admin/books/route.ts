import { NextRequest } from "next/server";
import { getAllBooks } from "@/lib/books";
import { isValidAdminToken, getAuthError } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.headers.get("x-admin-token");
  if (!isValidAdminToken(token)) return getAuthError();

  const books = getAllBooks();

  return Response.json({
    count: books.length,
    books: books.map((b) => ({
      slug: b.slug,
      title: b.frontmatter.title,
      author: b.frontmatter.author,
      isbn: b.frontmatter.isbn,
      category: b.frontmatter.category,
      rating: b.frontmatter.rating,
      asin: b.frontmatter.asin,
      amazonUrl: b.frontmatter.amazonUrl,
      amazonPrice: b.frontmatter.amazonPrice,
      coverImage: b.frontmatter.coverImage,
      date: b.frontmatter.date,
      featured: b.frontmatter.featured,
    })),
  });
}
