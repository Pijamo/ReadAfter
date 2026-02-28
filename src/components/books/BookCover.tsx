"use client";

import Image from "next/image";
import { useState } from "react";

interface BookCoverProps {
  isbn: string;
  title: string;
  author?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { width: 128, height: 192 },
  md: { width: 176, height: 264 },
  lg: { width: 256, height: 384 },
};

export default function BookCover({
  isbn,
  title,
  author,
  size = "md",
  className = "",
}: BookCoverProps) {
  const { width, height } = sizeMap[size];
  const [hasError, setHasError] = useState(false);
  const coverUrl = isbn
    ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    : "";

  if (!coverUrl || hasError) {
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

  return (
    <div
      className={`relative overflow-hidden rounded-lg book-shadow ${className}`}
      style={{ width, height }}
    >
      <Image
        src={coverUrl}
        alt={`Cover of ${title}`}
        width={width}
        height={height}
        className="object-cover w-full h-full"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
