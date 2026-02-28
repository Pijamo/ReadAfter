export interface BookBrief {
  title: string;
  author: string;
  whyRecommend: string;
}

export interface TopicBrief {
  suggestedTitle: string;
  slug: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  category: string;
  targetWordCount: number;
  books: BookBrief[];
  outline: string[];
  searchIntent: string;
}

export interface BookFrontmatter {
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

export interface ArticleDraft {
  slug: string;
  frontmatter: {
    title: string;
    description: string;
    date: string;
    category: string;
    tags: string[];
    readingTime: number;
    featured: boolean;
    books: BookFrontmatter[];
    seo: {
      focusKeyword: string;
      metaTitle: string;
      metaDescription: string;
    };
  };
  bodyMarkdown: string;
  fullMdx: string;
}

export interface EditResult {
  article: ArticleDraft;
  changesMade: string[];
}

export interface ManagerDecision {
  approved: boolean;
  score: number;
  feedback: string[];
  scores: {
    seoOptimization: number;
    contentQuality: number;
    affiliatePlacement: number;
    readability: number;
    factualAccuracy: number;
    compliance: number;
  };
}

export interface MarketingAssets {
  twitterPost: string;
  linkedinPost: string;
  instagramCaption: string;
  hashtags: string[];
  emailSnippet: string;
}

export interface PipelineConfig {
  category: string;
  count: number;
  existingSlugs: string[];
  dryRun: boolean;
}

export interface QAIssue {
  bookIndex: number;
  bookTitle: string;
  severity: "error" | "warning";
  issue: string;
  suggestion: string;
}

export interface PipelineResult {
  article: ArticleDraft;
  marketing: MarketingAssets;
  managerScore: number;
  revisionCycles: number;
  costUsd: number;
  qaIssues: QAIssue[];
  linkWarnings: string[];
  internalLinkSuggestions: number;
}

// =============================================
// Book Review Pipeline Types
// =============================================

export interface BookReviewBrief {
  title: string;
  author: string;
  isbn: string;
  slug: string;
  category: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  targetWordCount: number;
  angle: string;
  searchIntent: string;
}

export interface BookReviewFrontmatter {
  title: string;
  author: string;
  isbn: string;
  category: string;
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
  seo: {
    focusKeyword: string;
    metaTitle: string;
    metaDescription: string;
  };
}

export interface BookReviewDraft {
  slug: string;
  frontmatter: BookReviewFrontmatter;
  bodyMarkdown: string;
  fullMdx: string;
}

export interface BookEditResult {
  review: BookReviewDraft;
  changesMade: string[];
}

export interface BookPipelineConfig {
  category: string;
  count: number;
  existingSlugs: string[];
  dryRun: boolean;
}

export interface BookPipelineResult {
  review: BookReviewDraft;
  marketing: MarketingAssets;
  managerScore: number;
  revisionCycles: number;
  costUsd: number;
  qaIssues: QAIssue[];
  linkWarnings: string[];
  internalLinkSuggestions: number;
}
