import { Book } from "@/types/content";
import BookCard from "./BookCard";

export default function BookGrid({ books }: { books: Book[] }) {
  if (books.length === 0) return null;

  return (
    <div className="space-y-4 my-8">
      {books.map((book, i) => (
        <BookCard key={i} book={book} />
      ))}
    </div>
  );
}
