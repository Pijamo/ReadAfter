"use client";

import { useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBookSearch } from "@/hooks/useBookSearch";
import SearchResult from "./SearchResult";

interface SearchBarProps {
  onClose?: () => void;
}

export default function SearchBar({ onClose }: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    query,
    setQuery,
    results,
    isLoading,
    isOpen,
    setIsOpen,
    activeIndex,
    setActiveIndex,
    loadIndex,
  } = useBookSearch();

  // Load index on first focus
  const handleFocus = useCallback(() => {
    loadIndex();
    setIsOpen(true);
  }, [loadIndex, setIsOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  // Ctrl+K / Cmd+K global shortcut
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        loadIndex();
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [loadIndex, setIsOpen]);

  // Navigate to a book
  const handleSelect = useCallback(
    (slug: string) => {
      router.push(`/books/${slug}`);
      setIsOpen(false);
      setQuery("");
      onClose?.();
    },
    [router, setIsOpen, setQuery, onClose]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev: number) =>
          Math.min(prev + 1, results.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev: number) => Math.max(prev - 1, -1));
      } else if (
        e.key === "Enter" &&
        activeIndex >= 0 &&
        results[activeIndex]
      ) {
        e.preventDefault();
        handleSelect(results[activeIndex].slug);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
        onClose?.();
      }
    },
    [activeIndex, results, handleSelect, setActiveIndex, setIsOpen, onClose]
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search books..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-lg placeholder:text-muted/60 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
          role="combobox"
          aria-expanded={isOpen && results.length > 0}
          aria-controls="search-results"
          aria-activedescendant={
            activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
          }
          autoComplete="off"
        />
        {/* Ctrl+K hint (desktop only) */}
        {!query && (
          <kbd className="hidden lg:inline-flex absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted/50 bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 font-mono pointer-events-none">
            Ctrl K
          </kbd>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div
          id="search-results"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto"
        >
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-muted">Loading...</div>
          ) : results.length > 0 ? (
            results.map((book, index) => (
              <SearchResult
                key={book.slug}
                book={book}
                isActive={index === activeIndex}
                onSelect={handleSelect}
                id={`search-result-${index}`}
              />
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-muted">
              No books found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
