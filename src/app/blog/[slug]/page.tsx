import { notFound } from "next/navigation";
import { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import {
  getAllArticles,
  getArticleRawContent,
  getArticleFrontmatter,
} from "@/lib/content";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import ArticleHeader from "@/components/articles/ArticleHeader";
import BookGrid from "@/components/books/BookGrid";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const frontmatter = getArticleFrontmatter(slug);
  if (!frontmatter) return {};

  return {
    title: frontmatter.seo.metaTitle || frontmatter.title,
    description: frontmatter.seo.metaDescription || frontmatter.description,
    openGraph: {
      title: frontmatter.seo.metaTitle || frontmatter.title,
      description: frontmatter.seo.metaDescription || frontmatter.description,
      type: "article",
      publishedTime: frontmatter.date,
      url: `${SITE_URL}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const rawContent = getArticleRawContent(slug);
  const frontmatter = getArticleFrontmatter(slug);

  if (!rawContent || !frontmatter) {
    notFound();
  }

  const { content } = await compileMDX({
    source: rawContent,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    },
  });

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.date,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <ArticleHeader frontmatter={frontmatter} />

        <div className="prose">{content}</div>

        {frontmatter.books.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Books Mentioned in This Article
            </h2>
            <BookGrid books={frontmatter.books} />
          </section>
        )}
      </article>
    </>
  );
}
