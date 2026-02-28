import { NextRequest } from "next/server";
import path from "path";
import fs from "fs";
import { isValidAdminToken, getAuthError } from "@/lib/admin-auth";
import { runLinkCheck } from "@/lib/link-checker";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-admin-token");
  if (!isValidAdminToken(token)) return getAuthError();

  const contentRoot = path.join(process.cwd(), "content");
  const report = await runLinkCheck(contentRoot);

  // Also save report to disk for reference
  const outputDir = path.join(process.cwd(), "agents", "output");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "link-check-report.json"),
    JSON.stringify(report, null, 2)
  );

  return Response.json(report);
}

export async function GET(request: NextRequest) {
  const token = request.headers.get("x-admin-token");
  if (!isValidAdminToken(token)) return getAuthError();

  // Return the last saved report if available
  const reportPath = path.join(
    process.cwd(),
    "agents",
    "output",
    "link-check-report.json"
  );

  if (!fs.existsSync(reportPath)) {
    return Response.json({ error: "No report available. Run a check first." }, {
      status: 404,
    });
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
  return Response.json(report);
}
