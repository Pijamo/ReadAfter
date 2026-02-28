import { SearchableBook } from "@/types/search";

interface SearchResultProps {
  book: SearchableBook;
  isActive: boolean;
  onSelect: (slug: string) => void;
  id: string;
}

export default function SearchResult({
  book,
  isActive,
  onSelect,
  id,
}: SearchResultProps) {
  return (
    <button
      id={id}
      role="option"
      aria-selected={isActive}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isActive ? "bg-primary/10" : "hover:bg-stone-50"
      }`}
      onClick={() => onSelect(book.slug)}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Mini book icon */}
      <div className="flex-shrink-0 w-8 h-12 bg-gradient-to-br from-orange-100 to-amber-50 rounded border border-orange-200/50 flex items-center justify-center">
        <svg
          className="w-4 h-4 text-primary/50"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {book.title}
        </p>
        <p className="text-xs text-muted truncate">{book.author}</p>
      </div>

      <div className="flex-shrink-0 text-xs text-muted">
        {book.rating.toFixed(1)} ★
      </div>
    </button>
  );
}
