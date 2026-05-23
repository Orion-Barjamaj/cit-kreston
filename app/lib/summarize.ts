// lib/summarize.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function summarizeFile(
  fileUrl: string,
  fileName: string,
): Promise<string | null> {
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
        `Summarize this document in 3-5 sentences. Focus on key findings, dates, and any action items.\n\n${text}`,
      );
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const allSheets = workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        return `Sheet: ${sheetName}\n${csv}`;
      }).join("\n\n");

      result = await model.generateContent(
        `Summarize this spreadsheet in 3-5 sentences. Focus on key data, totals, and any action items.\n\n${allSheets}`,
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

export async function extractClientFromDocument(
  fileUrl: string,
  fileName: string,
): Promise<{ name: string; industry: string; risk: string; assigned_manager: string | null } | null> {
  try {
    const fileRes = await fetch(fileUrl);
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const prompt = `Extract client information from this document and return ONLY a JSON object, no markdown, no backticks, no explanation.
Exactly this shape:
{
  "name": "company or person name",
  "industry": "their industry e.g. Telecommunications, Banking, Retail",
  "risk": "a value from 1-10 where 1 is safe and 10 is very risky",
  "assigned_manager": "full name of the Kreston staff member responsible, or null if not mentioned"
}`;

    let result;

    if (fileName.endsWith(".pdf")) {
      result = await model.generateContent([
        {
          inlineData: {
            mimeType: "application/pdf",
            data: buffer.toString("base64"),
          },
        },
        { text: prompt },
      ]);
    } else if (fileName.endsWith(".docx")) {
      const { value: text } = await mammoth.extractRawText({ buffer });
      result = await model.generateContent(`${prompt}\n\n${text}`);
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      // parse Excel → convert every sheet to CSV text
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const allSheets = workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        return `Sheet: ${sheetName}\n${csv}`;
      }).join("\n\n");

      result = await model.generateContent(`${prompt}\n\n${allSheets}`);
    } else {
      return null;
    }

    const raw = result.response.text().trim();
    return JSON.parse(raw);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Extract client failed:", error.message);
    return null;
  }
}
