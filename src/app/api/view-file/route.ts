import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get("url");

  if (!fileUrl) {
    return NextResponse.json({ error: "Missing file URL" }, { status: 400 });
  }

  try {
    const targetUrl = fileUrl.trim();

    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 });
    }

    const res = await fetch(targetUrl);
    if (!res.ok) {
      return NextResponse.redirect(targetUrl);
    }

    const contentType = res.headers.get("content-type") || "application/pdf";
    const arrayBuffer = await res.arrayBuffer();

    const filename = targetUrl.split("/").pop()?.split("?")[0] || "document.pdf";

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
