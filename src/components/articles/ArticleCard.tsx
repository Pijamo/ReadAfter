import Link from "next/link";
import { ArticleMeta } from "@/types/content";
import CategoryBadge from "@/components/ui/CategoryBadge";

export default function ArticleCard({ article }: { article: ArticleMeta }) {
  const { slug, frontmatter } = article;
  const bookCount = frontmatter.books.length;

  return (
    <article className="border border-border rounded-xl bg-card p-6 hover:shadow-md transition-shadow">
      <Link href={`/blog/${slug}`} className="block">
        <div className="flex items-center gap-3 mb-3">
          <CategoryBadge slug={frontmatter.category} />
          <span className="text-xs text-muted">
            {frontmatter.readingTime} min read
          </span>
        </div>

        <h2 className="text-xl font-bold text-foreground leading-tight hover:text-primary transition-colors">
          {frontmatter.title}
        </h2>

        <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">
          {frontmatter.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted">
            {new Date(frontmatter.date).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          {bookCount > 0 && (
            <span className="text-xs text-primary font-medium">
              {bookCount} book{bookCount > 1 ? "s" : ""} reviewed
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
