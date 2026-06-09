import { NextResponse } from "next/server";
const pdfParse = require("pdf-parse-new");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const parsedData = await pdfParse(Buffer.from(buffer));

    return NextResponse.json({ text: parsedData.text });
  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
