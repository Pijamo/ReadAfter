import { Book } from "@/types/content";
import StarRating from "@/components/ui/StarRating";
import PriceCompare from "./PriceCompare";

export default function BookCard({ book }: { book: Book }) {
  return (
    <div className="border border-border rounded-xl bg-card p-5 flex flex-col sm:flex-row gap-5">
      {/* Book cover placeholder */}
      <div className="flex-shrink-0 w-28 h-40 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center border border-border">
        <div className="text-center px-2">
          <p className="text-xs font-bold text-foreground leading-tight">
            {book.title}
          </p>
          <p className="text-[10px] text-muted mt-1">{book.author}</p>
        </div>
      </div>

      {/* Book info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-foreground">{book.title}</h3>
        <p className="text-sm text-muted mt-0.5">by {book.author}</p>

        <div className="mt-2">
          <StarRating rating={book.rating} />
        </div>

        <p className="text-sm text-stone-600 mt-3 leading-relaxed">
          {book.summary}
        </p>

        <div className="mt-4">
          <PriceCompare
            amazonUrl={book.amazonUrl}
            amazonPrice={book.amazonPrice}
          />
        </div>
      </div>
    </div>
  );
}
