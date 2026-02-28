import { defineConfig } from "tinacms";

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

const categoryOptions = [
  { value: "entrepreneurship", label: "Entrepreneurship" },
  { value: "productivity", label: "Productivity" },
  { value: "personal-finance", label: "Personal Finance" },
  { value: "leadership", label: "Leadership" },
  { value: "self-help", label: "Self-Help" },
  { value: "career-growth", label: "Career Growth" },
];

// Shared SEO fields used by both books and articles
const seoFields = [
  {
    type: "string" as const,
    name: "focusKeyword",
    label: "Focus Keyword",
  },
  {
    type: "string" as const,
    name: "metaTitle",
    label: "Meta Title",
    description: "SEO title (50-60 chars recommended)",
  },
  {
    type: "string" as const,
    name: "metaDescription",
    label: "Meta Description",
    description: "SEO description (150-160 chars recommended)",
    ui: { component: "textarea" },
  },
];

export default defineConfig({
  branch,

  // Get these from tina.io after creating a project
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || "",
  token: process.env.TINA_TOKEN || "",

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      // ===================== BOOKS =====================
      {
        name: "book",
        label: "Books",
        path: "content/books",
        format: "mdx",
        ui: {
          filename: {
            readonly: false,
            slugify: (values) =>
              (values?.title || "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "author",
            label: "Author",
            required: true,
          },
          {
            type: "string",
            name: "isbn",
            label: "ISBN",
            description: "10 or 13 digit ISBN (no hyphens)",
          },
          {
            type: "string",
            name: "asin",
            label: "ASIN",
            description:
              "Amazon Standard Identification Number (auto-extracted from URL if blank)",
          },
          {
            type: "string",
            name: "category",
            label: "Category",
            required: true,
            options: categoryOptions,
          },
          {
            type: "number",
            name: "rating",
            label: "Rating",
            description: "1.0 to 5.0",
          },
          {
            type: "string",
            name: "summary",
            label: "Summary",
            description: "Brief description of the book",
            ui: { component: "textarea" },
          },
          {
            type: "string",
            name: "amazonUrl",
            label: "Amazon URL",
            description:
              "Full Amazon.in affiliate link (e.g. https://www.amazon.in/dp/ASIN?tag=readafter-21)",
          },
          {
            type: "number",
            name: "amazonPrice",
            label: "Amazon Price (INR)",
          },
          {
            type: "string",
            name: "coverImage",
            label: "Custom Cover Image URL",
            description:
              "Leave empty to use Open Library cover. Set a URL to override.",
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
          },
          {
            type: "datetime",
            name: "date",
            label: "Publish Date",
          },
          {
            type: "boolean",
            name: "featured",
            label: "Featured",
            description: "Show on homepage",
          },
          {
            type: "string",
            name: "relatedBooks",
            label: "Related Books",
            list: true,
            description: "Slugs of related books (e.g. deep-work, atomic-habits)",
          },
          {
            type: "object",
            name: "seo",
            label: "SEO",
            fields: seoFields,
          },
          {
            type: "rich-text",
            name: "body",
            label: "Review Content",
            isBody: true,
          },
        ],
      },

      // ===================== ARTICLES =====================
      {
        name: "article",
        label: "Blog Posts",
        path: "content/articles",
        format: "mdx",
        ui: {
          filename: {
            readonly: false,
            slugify: (values) =>
              (values?.title || "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            ui: { component: "textarea" },
          },
          {
            type: "datetime",
            name: "date",
            label: "Publish Date",
          },
          {
            type: "string",
            name: "category",
            label: "Category",
            required: true,
            options: categoryOptions,
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
          },
          {
            type: "number",
            name: "readingTime",
            label: "Reading Time (minutes)",
          },
          {
            type: "boolean",
            name: "featured",
            label: "Featured",
            description: "Show on homepage",
          },
          {
            type: "object",
            name: "books",
            label: "Featured Books",
            list: true,
            fields: [
              {
                type: "string",
                name: "title",
                label: "Title",
                required: true,
              },
              {
                type: "string",
                name: "author",
                label: "Author",
              },
              {
                type: "string",
                name: "amazonUrl",
                label: "Amazon URL",
              },
              {
                type: "number",
                name: "amazonPrice",
                label: "Amazon Price (INR)",
              },
              {
                type: "string",
                name: "imageUrl",
                label: "Image URL",
              },
              {
                type: "number",
                name: "rating",
                label: "Rating",
              },
              {
                type: "string",
                name: "summary",
                label: "Summary",
                ui: { component: "textarea" },
              },
            ],
          },
          {
            type: "object",
            name: "seo",
            label: "SEO",
            fields: seoFields,
          },
          {
            type: "rich-text",
            name: "body",
            label: "Article Content",
            isBody: true,
          },
        ],
      },
    ],
  },
});
