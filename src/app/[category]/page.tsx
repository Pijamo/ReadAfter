import { notFound } from "next/navigation";
import { Metadata } from "next";
import { categories, getCategoryBySlug } from "@/lib/categories";
import { getArticlesByCategory } from "@/lib/content";
import { SITE_NAME } from "@/lib/constants";
import ArticleCard from "@/components/articles/ArticleCard";
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

  const articles = getArticlesByCategory(cat.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <Breadcrumbs items={[{ label: cat.name }]} />

      <div className="mt-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          {cat.name} Books
        </h1>
        <p className="mt-3 text-lg text-muted max-w-2xl">{cat.description}</p>
      </div>

      {articles.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
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
