// convert PDF => array of { page, blob } using pdfjs-dist
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Use CDN worker to avoid bundling issues (compatible with dev)
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://unpkg.com/pdfjs-dist@2.17.570/build/pdf.worker.min.js";

/**
 * convertPdfToImages(file: File) => Promise<[ {page: number, blob: Blob} ]>
 */
export async function convertPdfToImages(file) {
  if (!file) return [];

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const results = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    // viewport at scale 1.5 (adjust if you want higher DPI)
    const viewport = page.getViewport({ scale: 1.5 });

    // create a canvas
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");

    const renderContext = {
      canvasContext: ctx,
      viewport,
    };

    await page.render(renderContext).promise;

    // convert to blob (jpeg)
    const blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", 0.85)
    );

    results.push({ page: p, blob });
  }

  return results;
}
