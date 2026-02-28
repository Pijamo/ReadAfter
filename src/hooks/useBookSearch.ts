"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { SearchableBook } from "@/types/search";

export function useBookSearch() {
  const [books, setBooks] = useState<SearchableBook[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const hasFetched = useRef(false);

  // Lazy fetch: only load the index when search is first activated
  const loadIndex = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setIsLoading(true);
    try {
      const res = await fetch("/api/search-index");
      const data: SearchableBook[] = await res.json();
      setBooks(data);
    } catch (err) {
      console.error("Failed to load search index:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter results based on query — instant on small dataset
  const results = useMemo(() => {
    if (!query.trim() || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    return books
      .filter(
        (book) =>
          book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q) ||
          book.isbn.includes(q) ||
          book.tags.some((tag) => tag.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [query, books]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    isOpen,
    setIsOpen,
    activeIndex,
    setActiveIndex,
    loadIndex,
  };
}
