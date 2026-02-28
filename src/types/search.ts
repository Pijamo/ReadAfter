export interface SearchableBook {
  slug: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  rating: number;
  coverImage: string;
  tags: string[];
}
