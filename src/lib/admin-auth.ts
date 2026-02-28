/**
 * Simple token-based admin authentication.
 * Set ADMIN_TOKEN environment variable to protect admin routes.
 */

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

export function isValidAdminToken(token: string | null): boolean {
  if (!ADMIN_TOKEN) {
    // If no token is configured, admin is disabled in production
    if (process.env.NODE_ENV === "production") return false;
    // In development, allow access without token
    return true;
  }
  return token === ADMIN_TOKEN;
}

export function getAuthError(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
