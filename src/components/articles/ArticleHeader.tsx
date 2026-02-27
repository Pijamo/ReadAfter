import CategoryBadge from "@/components/ui/CategoryBadge";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { ArticleFrontmatter } from "@/types/content";
import { getCategoryBySlug } from "@/lib/categories";

export default function ArticleHeader({
  frontmatter,
}: {
  frontmatter: ArticleFrontmatter;
}) {
  const category = getCategoryBySlug(frontmatter.category);

  return (
    <header className="mb-8">
      <Breadcrumbs
        items={[
          {
            label: category?.name || frontmatter.category,
            href: `/${frontmatter.category}`,
          },
          { label: frontmatter.title },
        ]}
      />

      <div className="mt-4 flex items-center gap-3">
        <CategoryBadge slug={frontmatter.category} />
        <span className="text-sm text-muted">
          {frontmatter.readingTime} min read
        </span>
      </div>

      <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground leading-tight">
        {frontmatter.title}
      </h1>

      <p className="mt-3 text-lg text-muted leading-relaxed">
        {frontmatter.description}
      </p>

      <div className="mt-4 text-sm text-muted">
        {new Date(frontmatter.date).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>

      {/* Affiliate disclosure */}
      <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
        This article contains affiliate links. If you purchase through these
        links, we may earn a small commission at no extra cost to you.
      </div>
    </header>
  );
}
