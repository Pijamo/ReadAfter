import Link from "next/link";
import { BookMeta } from "@/types/content";
import BookCover from "./BookCover";
import StarRating from "@/components/ui/StarRating";

export default function BookReviewCard({ book }: { book: BookMeta }) {
  const { slug, frontmatter } = book;
  const hasPrice = frontmatter.amazonPrice != null;

  return (
    <Link
      href={`/books/${slug}`}
      className="group block bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200"
    >
      {/* Cover area */}
      <div className="relative flex justify-center pt-6 pb-4 bg-stone-50">
        <div className="transition-transform duration-200 group-hover:scale-105">
          <BookCover
            isbn={frontmatter.isbn}
            title={frontmatter.title}
            author={frontmatter.author}
            size="sm"
          />
        </div>
      </div>

      {/* Info area */}
      <div className="p-3 sm:p-4">
        <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {frontmatter.title}
        </h3>
        <p className="text-xs text-muted mt-1 truncate">{frontmatter.author}</p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <StarRating rating={frontmatter.rating} />
          {hasPrice && (
            <span className="text-xs font-semibold text-green-700 whitespace-nowrap">
              &#8377;{frontmatter.amazonPrice!.toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
