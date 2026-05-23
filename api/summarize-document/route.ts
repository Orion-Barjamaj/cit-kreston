// app/api/summarize-document/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { fileUrl, fileName } = await req.json();

  // fetch the file from Supabase storage
  const fileRes = await fetch(fileUrl);
  const buffer = Buffer.from(await fileRes.arrayBuffer());

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  let result;
  const isPdf = fileName.endsWith(".pdf");
  const isDocx = fileName.endsWith(".docx");

  if (isPdf) {
    // Gemini reads PDFs natively via base64
    result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: buffer.toString("base64"),
        },
      },
      "Summarize this document in 3-5 sentences. Focus on key findings, dates, and any action items.",
    ]);
  } else if (isDocx) {
    // extract text first, then send as plain text
    const { value: text } = await mammoth.extractRawText({ buffer });
    result = await model.generateContent([
      `Summarize this document in 3-5 sentences. Focus on key findings, dates, and any action items.\n\n${text}`,
    ]);
  } else {
    return Response.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const summary = result.response.text();
  return Response.json({ summary });
}