// wrapper that reuses pdfToImage render but returns PNG blobs
import { convertPdfToImages } from "./pdfToImage";

/**
 * convertPdfToPng(file: File) => Promise<[ {page, blob} ]>
 * Uses pdfToImage render and converts to PNG.
 */
export async function convertPdfToPng(file) {
  const jpgResults = await convertPdfToImages(file);

  // Convert each JPEG blob to PNG by drawing onto canvas and exporting PNG
  const results = [];
  for (const item of jpgResults) {
    const imgUrl = URL.createObjectURL(item.blob);
    // load image
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = imgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const pngBlob = await new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/png")
    );

    URL.revokeObjectURL(imgUrl);
    results.push({ page: item.page, blob: pngBlob });
  }

  return results;
}
