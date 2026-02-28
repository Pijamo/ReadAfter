import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { isValidAdminToken, getAuthError } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const BOOKS_DIR = path.join(process.cwd(), "content", "books");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const token = request.headers.get("x-admin-token");
  if (!isValidAdminToken(token)) return getAuthError();

  const { slug } = await params;
  const filePath = path.join(BOOKS_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return Response.json({ error: "Book not found" }, { status: 404 });
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return Response.json({
    slug,
    frontmatter: data,
    bodyWordCount: content.split(/\s+/).filter(Boolean).length,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const token = request.headers.get("x-admin-token");
  if (!isValidAdminToken(token)) return getAuthError();

  const { slug } = await params;
  const filePath = path.join(BOOKS_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return Response.json({ error: "Book not found" }, { status: 404 });
  }

  const updates = (await request.json()) as Record<string, unknown>;

  // Read existing file
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  // Only allow updating specific fields
  const allowedFields = [
    "amazonUrl",
    "amazonPrice",
    "isbn",
    "asin",
    "coverImage",
    "rating",
    "summary",
    "tags",
    "featured",
    "title",
    "author",
  ];

  const updatedFields: string[] = [];

  for (const field of allowedFields) {
    if (field in updates) {
      data[field] = updates[field];
      updatedFields.push(field);
    }
  }

  if (updatedFields.length === 0) {
    return Response.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  // Write back
  const newRaw = matter.stringify(content, data);
  fs.writeFileSync(filePath, newRaw);

  return Response.json({
    success: true,
    slug,
    updatedFields,
  });
}
