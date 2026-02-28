import { notFound } from "next/navigation";
import { Metadata } from "next";
import { categories, getCategoryBySlug } from "@/lib/categories";
import { getBooksByCategory } from "@/lib/books";
import { SITE_NAME } from "@/lib/constants";
import BookReviewCard from "@/components/books/BookReviewCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return categories.map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) return {};

  return {
    title: `Best ${cat.name} Books | ${SITE_NAME}`,
    description: cat.description,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = getCategoryBySlug(category);

  if (!cat) {
    notFound();
  }

  const books = getBooksByCategory(cat.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Books", href: "/books" },
          { label: cat.name },
        ]}
      />

      <div className="mt-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          {cat.name} Books
        </h1>
        <p className="mt-3 text-lg text-muted max-w-2xl">{cat.description}</p>
      </div>

      {books.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {books.map((book) => (
            <BookReviewCard key={book.slug} book={book} />
          ))}
        </div>
      ) : (
        <div className="mt-10 text-center py-16">
          <p className="text-lg text-muted">
            We&apos;re working on recommendations for this category. Check back
            soon!
          </p>
        </div>
      )}
    </div>
  );
}
