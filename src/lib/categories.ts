import { CategoryInfo } from "@/types/content";

export const categories: CategoryInfo[] = [
  {
    slug: "entrepreneurship",
    name: "Entrepreneurship",
    description:
      "Books on startups, business building, and innovation for aspiring Indian entrepreneurs.",
  },
  {
    slug: "productivity",
    name: "Productivity",
    description:
      "Master your time and habits with the best productivity books recommended for professionals.",
  },
  {
    slug: "personal-finance",
    name: "Personal Finance",
    description:
      "Investing, saving, and building wealth — the best personal finance books for Indians.",
  },
  {
    slug: "leadership",
    name: "Leadership",
    description:
      "Management, influence, and team-building books for current and future leaders.",
  },
  {
    slug: "self-help",
    name: "Self-Help",
    description:
      "Mindset, motivation, and personal growth books to transform your life.",
  },
  {
    slug: "career-growth",
    name: "Career Growth",
    description:
      "Skills, career transitions, and professional development books for ambitious professionals.",
  },
];

export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getCategorySlugs(): string[] {
  return categories.map((c) => c.slug);
}
