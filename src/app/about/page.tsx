import { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export const metadata: Metadata = {
  title: `About Us | ${SITE_NAME}`,
  description: `${SITE_NAME} helps Indian readers discover the best self-help, business, and personal finance books with honest reviews and price comparison.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <Breadcrumbs items={[{ label: "About" }]} />

      <h1 className="mt-6 text-3xl sm:text-4xl font-bold text-foreground">
        About {SITE_NAME}
      </h1>

      <div className="mt-8 prose">
        <p>
          {SITE_NAME} is a book recommendation platform built for Indian
          readers. We curate the best books in self-help, business,
          entrepreneurship, personal finance, productivity, and career growth.
        </p>

        <h2>What We Do</h2>
        <p>
          We read, research, and review books so you don&apos;t have to sift
          through thousands of options. Every recommendation on our site is
          backed by careful analysis of reader reviews, author credibility, and
          practical applicability for Indian professionals.
        </p>

        <h2>Price Comparison</h2>
        <p>
          Books in India are available across multiple platforms, often at
          different prices. We compare prices across Amazon India and Flipkart so
          you can find the best deal every time.
        </p>

        <h2>Our Mission</h2>
        <p>
          We believe that the right book at the right time can change the
          trajectory of your life. Our mission is to make that match — connecting
          Indian readers with books that genuinely make a difference in their
          personal and professional lives.
        </p>

        <h2>How We Earn</h2>
        <p>
          {SITE_NAME} is supported through affiliate partnerships with Amazon
          India and Flipkart. When you purchase a book through our links, we earn
          a small commission at no extra cost to you. This helps us keep the site
          running and continue creating recommendations. For full details, see
          our{" "}
          <a href="/disclaimer" className="text-primary">
            Affiliate Disclaimer
          </a>
          .
        </p>
      </div>
    </div>
  );
}
