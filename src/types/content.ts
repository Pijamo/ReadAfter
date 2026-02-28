// --- Existing types (backward compat for articles) ---

export interface Book {
  title: string;
  author: string;
  amazonUrl: string;
  flipkartUrl: string;
  amazonPrice: number | null;
  flipkartPrice: number | null;
  imageUrl: string;
  rating: number;
  summary: string;
}

export interface SEOMeta {
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
}

export interface ArticleFrontmatter {
  title: string;
  description: string;
  date: string;
  category: Category;
  tags: string[];
  readingTime: number;
  featured: boolean;
  books: Book[];
  seo: SEOMeta;
}

export interface ArticleMeta {
  slug: string;
  frontmatter: ArticleFrontmatter;
}

// --- New: Book as first-class content ---

export interface BookFrontmatter {
  title: string;
  author: string;
  isbn: string;
  category: Category;
  rating: number;
  summary: string;
  amazonUrl: string;
  flipkartUrl: string;
  amazonPrice: number | null;
  flipkartPrice: number | null;
  tags: string[];
  date: string;
  featured: boolean;
  relatedBooks: string[];
  seo: SEOMeta;
}

export interface BookMeta {
  slug: string;
  frontmatter: BookFrontmatter;
}

// --- Shared ---

export type Category =
  | "entrepreneurship"
  | "productivity"
  | "personal-finance"
  | "leadership"
  | "self-help"
  | "career-growth";

export interface CategoryInfo {
  slug: Category;
  name: string;
  description: string;
}
