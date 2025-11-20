// extract text from PDF using pdfjs-dist
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@2.17.570/build/pdf.worker.min.js";

/**
 * extractTextFromPDF(file: File) => Promise<string>
 */
export async function extractTextFromPDF(file) {
  if (!file) return "";

  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((i) => i.str).join(" ");
    fullText += `\n\n--- Page ${p} ---\n\n` + pageText;
  }

  return fullText.trim();
}
