"use client";

import { useState, useEffect, useCallback } from "react";

interface BookSummary {
  slug: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  rating: number;
  amazonUrl: string;
  amazonPrice: number | null;
  date: string;
  featured: boolean;
}

interface LinkCheckReport {
  checkedAt: string;
  totalChecked: number;
  brokenAmazonLinks: number;
  brokenCoverImages: number;
  missingInternalLinks: number;
  results: LinkCheckResult[];
}

interface LinkCheckResult {
  slug: string;
  title: string;
  type: string;
  amazonUrl: { url: string; status: number | null; ok: boolean; error?: string };
  coverImage: { url: string; isbn: string; ok: boolean; error?: string };
  internalLinks: { slug: string; exists: boolean }[];
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [linkReport, setLinkReport] = useState<LinkCheckReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingLinks, setCheckingLinks] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});
  const [saveMessage, setSaveMessage] = useState("");

  const headers = useCallback(
    () => ({ "x-admin-token": token, "Content-Type": "application/json" }),
    [token]
  );

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/books", { headers: headers() });
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      setBooks(data.books || []);
      setAuthenticated(true);
    } catch {
      setAuthenticated(false);
    }
    setLoading(false);
  }, [headers]);

  const fetchLinkReport = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/check-links", { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setLinkReport(data);
      }
    } catch {
      // No report available
    }
  }, [headers]);

  const handleLogin = async () => {
    await fetchBooks();
    await fetchLinkReport();
  };

  const runLinkCheck = async () => {
    setCheckingLinks(true);
    try {
      const res = await fetch("/api/admin/check-links", {
        method: "POST",
        headers: headers(),
      });
      if (res.ok) {
        const data = await res.json();
        setLinkReport(data);
      }
    } catch (err) {
      console.error("Link check failed:", err);
    }
    setCheckingLinks(false);
  };

  const startEdit = async (slug: string) => {
    const res = await fetch(`/api/admin/books/${slug}`, { headers: headers() });
    if (res.ok) {
      const data = await res.json();
      setEditForm(data.frontmatter);
      setEditingSlug(slug);
      setSaveMessage("");
    }
  };

  const saveEdit = async () => {
    if (!editingSlug) return;

    const res = await fetch(`/api/admin/books/${editingSlug}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(editForm),
    });

    if (res.ok) {
      setSaveMessage("Saved successfully!");
      setEditingSlug(null);
      await fetchBooks();
    } else {
      setSaveMessage("Save failed.");
    }
  };

  const getLinkStatus = (slug: string) => {
    if (!linkReport) return null;
    return linkReport.results.find((r) => r.slug === slug);
  };

  useEffect(() => {
    // Check localStorage for saved token
    const saved = localStorage.getItem("admin-token");
    if (saved) {
      setToken(saved);
    }
  }, []);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="bg-white p-8 rounded-xl border border-stone-200 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-stone-900 mb-6">
            Admin Access
          </h1>
          <input
            type="password"
            placeholder="Enter admin token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg mb-4 text-stone-900"
          />
          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">
              ReadAfter Admin
            </h1>
            <p className="text-stone-500 mt-1">
              {books.length} books &middot; Manage content and check links
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={runLinkCheck}
              disabled={checkingLinks}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {checkingLinks ? "Checking..." : "Run Link Check"}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("admin-token");
                setAuthenticated(false);
                setToken("");
              }}
              className="px-4 py-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-100"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Link Check Summary */}
        {linkReport && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-stone-900 mb-3">
              Link Health Report
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat
                label="Total Checked"
                value={linkReport.totalChecked}
                color="stone"
              />
              <Stat
                label="Broken Links"
                value={linkReport.brokenAmazonLinks}
                color={linkReport.brokenAmazonLinks > 0 ? "red" : "green"}
              />
              <Stat
                label="Missing Covers"
                value={linkReport.brokenCoverImages}
                color={linkReport.brokenCoverImages > 0 ? "red" : "green"}
              />
              <Stat
                label="Missing Internal"
                value={linkReport.missingInternalLinks}
                color={linkReport.missingInternalLinks > 0 ? "amber" : "green"}
              />
            </div>
            <p className="text-xs text-stone-400 mt-3">
              Last checked: {new Date(linkReport.checkedAt).toLocaleString()}
            </p>
          </div>
        )}

        {/* Edit Modal */}
        {editingSlug && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-stone-900 mb-4">
                Edit: {editingSlug}
              </h2>
              <div className="space-y-3">
                <Field
                  label="Amazon URL"
                  value={(editForm.amazonUrl as string) || ""}
                  onChange={(v) => setEditForm({ ...editForm, amazonUrl: v })}
                />
                <Field
                  label="Amazon Price (INR)"
                  value={String(editForm.amazonPrice ?? "")}
                  onChange={(v) =>
                    setEditForm({
                      ...editForm,
                      amazonPrice: v ? Number(v) : null,
                    })
                  }
                />
                <Field
                  label="ISBN"
                  value={(editForm.isbn as string) || ""}
                  onChange={(v) => setEditForm({ ...editForm, isbn: v })}
                />
                <Field
                  label="Rating"
                  value={String(editForm.rating ?? "")}
                  onChange={(v) =>
                    setEditForm({ ...editForm, rating: Number(v) })
                  }
                />
                {/* Cover preview */}
                {typeof editForm.isbn === "string" && editForm.isbn && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-stone-500 mb-1">
                      Cover Preview
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://covers.openlibrary.org/b/isbn/${editForm.isbn}-M.jpg`}
                      alt="Book cover"
                      className="w-24 h-auto rounded border"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingSlug(null)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
              </div>
              {saveMessage && (
                <p className="mt-3 text-sm text-green-600">{saveMessage}</p>
              )}
            </div>
          </div>
        )}

        {/* Books Table */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="text-left px-4 py-3 font-semibold text-stone-600">
                    Book
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-600">
                    ISBN
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-600">
                    Price
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-stone-600">
                    Link
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-stone-600">
                    Cover
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-stone-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-stone-400">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  books.map((book) => {
                    const linkStatus = getLinkStatus(book.slug);
                    return (
                      <tr
                        key={book.slug}
                        className="border-b border-stone-100 hover:bg-stone-50"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-stone-900">
                            {book.title}
                          </div>
                          <div className="text-xs text-stone-400">
                            {book.author} &middot; {book.category}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-stone-600">
                          {book.isbn}
                        </td>
                        <td className="px-4 py-3 text-stone-600">
                          {book.amazonPrice
                            ? `₹${book.amazonPrice.toLocaleString("en-IN")}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {linkStatus ? (
                            linkStatus.amazonUrl.ok ? (
                              <span className="text-green-600" title="OK">
                                ✅
                              </span>
                            ) : (
                              <span
                                className="text-red-600"
                                title={
                                  linkStatus.amazonUrl.error ||
                                  `Status: ${linkStatus.amazonUrl.status}`
                                }
                              >
                                ❌
                              </span>
                            )
                          ) : (
                            <span className="text-stone-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {linkStatus ? (
                            linkStatus.coverImage.ok ? (
                              <span className="text-green-600" title="OK">
                                ✅
                              </span>
                            ) : (
                              <span
                                className="text-red-600"
                                title={
                                  linkStatus.coverImage.error || "Missing"
                                }
                              >
                                ❌
                              </span>
                            )
                          ) : (
                            <span className="text-stone-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => startEdit(book.slug)}
                            className="text-xs px-3 py-1 border border-stone-300 rounded hover:bg-stone-100 text-stone-600"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    stone: "text-stone-900",
    green: "text-green-600",
    red: "text-red-600",
    amber: "text-amber-600",
  };

  return (
    <div>
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-2xl font-bold ${colors[color] || colors.stone}`}>
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-stone-500">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900"
      />
    </div>
  );
}
