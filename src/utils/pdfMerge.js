// Merge PDFs using pdf-lib
import { PDFDocument } from "pdf-lib";

/**
 * mergePDFs(files: File[]) => Promise<Uint8Array>
 * Returns merged PDF bytes (Uint8Array)
 */
export async function mergePDFs(files) {
  if (!files || files.length === 0) throw new Error("No files to merge");

  const mergedPdf = await PDFDocument.create();

  for (const f of files) {
    const arrayBuffer = await f.arrayBuffer();
    const pdfToMerge = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(
      pdfToMerge,
      pdfToMerge.getPageIndices()
    );
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedBytes = await mergedPdf.save();
  return mergedBytes;
}
