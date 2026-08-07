import { NextResponse } from "next/server";
import { isAllowedProxyUrl } from "@/lib/api-guard";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: Request) {
  // Rate limit: 30 requests per minute per IP
  const rl = rateLimit(request, "view-file", { limit: 30, windowMs: 60_000 });
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get("url");

  if (!fileUrl) {
    return NextResponse.json({ error: "Missing file URL" }, { status: 400 });
  }

  // SSRF protection: only proxy requests to explicitly allowlisted hosts.
  // The allowlist is defined in src/lib/api-guard.ts → ALLOWED_PROXY_HOSTS.
  // Add new storage domains there when integrating new services.
  if (!isAllowedProxyUrl(fileUrl)) {
    return NextResponse.json(
      {
        error:
          "Access denied. This file URL is not from an allowed domain. " +
          "Only Supabase Storage and Google Drive URLs are permitted.",
      },
      { status: 403 }
    );
  }

  try {
    const res = await fetch(fileUrl);
    if (!res.ok) {
      return NextResponse.redirect(fileUrl);
    }

    const contentType = res.headers.get("content-type") || "application/pdf";
    const arrayBuffer = await res.arrayBuffer();
    const filename = fileUrl.split("/").pop()?.split("?")[0] || "document.pdf";

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType.includes("octet-stream") ? "application/pdf" : contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error: any) {
    console.error("View file proxy error:", error);
    return NextResponse.redirect(fileUrl);
  }
}
