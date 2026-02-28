import { notFound } from "next/navigation";
import { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import {
  getAllBooks,
  getBookBySlug,
  getBookRawContent,
  getBookCoverUrl,
  getRelatedBooks,
} from "@/lib/books";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import BookDetail from "@/components/books/BookDetail";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const books = getAllBooks();
  return books.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) return {};

  const { frontmatter } = book;
  const coverUrl = getBookCoverUrl(frontmatter.isbn);

  return {
    title: frontmatter.seo.metaTitle || `${frontmatter.title} by ${frontmatter.author}`,
    description: frontmatter.seo.metaDescription || frontmatter.summary,
    openGraph: {
      title: frontmatter.seo.metaTitle || frontmatter.title,
      description: frontmatter.seo.metaDescription || frontmatter.summary,
      type: "article",
      publishedTime: frontmatter.date,
      url: `${SITE_URL}/books/${slug}`,
      images: coverUrl ? [{ url: coverUrl }] : undefined,
    },
  };
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const rawContent = getBookRawContent(slug);
  const book = getBookBySlug(slug);

  if (!rawContent || !book) {
    notFound();
  }

  const { content } = await compileMDX({
    source: rawContent,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    },
  });

  const relatedBooks = getRelatedBooks(book);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.frontmatter.title,
    author: { "@type": "Person", name: book.frontmatter.author },
    isbn: book.frontmatter.isbn,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: book.frontmatter.rating,
      bestRating: 5,
    },
    review: {
      "@type": "Review",
      author: { "@type": "Organization", name: SITE_NAME },
      reviewRating: {
        "@type": "Rating",
        ratingValue: book.frontmatter.rating,
        bestRating: 5,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <BookDetail
        frontmatter={book.frontmatter}
        content={content}
        relatedBooks={relatedBooks}
      />
    </>
  );
}
