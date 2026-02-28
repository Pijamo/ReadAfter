"use client";

import Image from "next/image";
import { useState, useCallback } from "react";

interface BookCoverProps {
  isbn: string;
  title: string;
  author?: string;
  coverImage?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { width: 128, height: 192 },
  md: { width: 176, height: 264 },
  lg: { width: 256, height: 384 },
};

function Placeholder({
  title,
  author,
  width,
  height,
  className,
}: {
  title: string;
  author?: string;
  width: number;
  height: number;
  className: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br from-orange-100 to-amber-50 rounded-lg flex flex-col items-center justify-center border border-orange-200/50 book-shadow ${className}`}
      style={{ width, height }}
    >
      <div className="px-3 text-center">
        <p className="text-sm font-bold text-stone-800 leading-tight line-clamp-3">
          {title}
        </p>
        {author && (
          <p className="mt-1.5 text-xs text-stone-500">{author}</p>
        )}
      </div>
    </div>
  );
}

export default function BookCover({
  isbn,
  title,
  author,
  coverImage,
  size = "md",
  className = "",
}: BookCoverProps) {
  const { width, height } = sizeMap[size];
  const [hasError, setHasError] = useState(false);

  // Priority: custom coverImage > Open Library via ISBN > placeholder
  const imageUrl = coverImage
    ? coverImage
    : isbn
      ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
      : "";

  // Detect Open Library's tiny 1x1 placeholder (returned instead of 404)
  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      // Open Library returns a 1x1 transparent pixel for missing covers
      if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
        setHasError(true);
      }
    },
    []
  );

  if (!imageUrl || hasError) {
    return (
      <Placeholder
        title={title}
        author={author}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg book-shadow ${className}`}
      style={{ width, height }}
    >
      <Image
        src={imageUrl}
        alt={`Cover of ${title}`}
        width={width}
        height={height}
        className="object-cover w-full h-full"
        onError={() => setHasError(true)}
        onLoad={handleLoad}
      />
    </div>
  );
}
