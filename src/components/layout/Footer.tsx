import Link from "next/link";
import { categories } from "@/lib/categories";
import { SITE_NAME } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold tracking-tight">
              <span className="text-foreground">read</span>
              <span className="text-primary">after</span>
            </h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Curated book recommendations for Indian readers. Best prices
              on Amazon India.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Categories
            </h4>
            <ul className="mt-3 space-y-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/books?category=${cat.slug}`}
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Links
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/books"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Browse Books
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/disclaimer"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Affiliate Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
