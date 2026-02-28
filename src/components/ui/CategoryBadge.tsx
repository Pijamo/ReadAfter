import Link from "next/link";
import { getCategoryBySlug } from "@/lib/categories";

export default function CategoryBadge({ slug }: { slug: string }) {
  const category = getCategoryBySlug(slug);
  if (!category) return null;

  return (
    <Link
      href={`/books?category=${slug}`}
      className="inline-block text-xs font-medium uppercase tracking-wider text-primary bg-orange-50 px-2.5 py-1 rounded-full hover:bg-orange-100 transition-colors"
    >
      {category.name}
    </Link>
  );
}
