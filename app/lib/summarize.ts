// lib/summarize.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function summarizeFile(fileUrl: string, fileName: string): Promise<string | null> {
  try {
    const fileRes = await fetch(fileUrl);
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    let result;

    if (fileName.endsWith(".pdf")) {
      result = await model.generateContent([
        {
          inlineData: {
            mimeType: "application/pdf",
            data: buffer.toString("base64"),
          },
        },
        "Summarize this document in 3-5 sentences. Focus on key findings, dates, and any action items.",
      ]);
    } else if (fileName.endsWith(".docx")) {
      const { value: text } = await mammoth.extractRawText({ buffer });
      result = await model.generateContent(
        `Summarize this document in 3-5 sentences. Focus on key findings, dates, and any action items.\n\n${text}`
      );
    } else {
      return null;
    }

    return result.response.text();
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Summarize failed:", error.message, JSON.stringify(err));
    return null;
  }
}
