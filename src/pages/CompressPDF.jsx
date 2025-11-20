import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";

export default function CompressPDF() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [quality, setQuality] = useState("medium");
  const [loading, setLoading] = useState(false);

  // Convert a PDF page into a compressed JPEG using a canvas
  async function renderPageToCompressedImage(pdf, pageIndex, scaleFactor = 0.5) {
    const page = pdf.getPage(pageIndex);

    const viewport = page.getViewport({ scale: 1.0 * scaleFactor });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    return await new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.6 // compression level
      );
    });
  }

  async function handleCompress() {
    if (!file) return alert("Upload a PDF first!");

    setLoading(true);

    const arrayBuffer = await file.arrayBuffer();

    // Load into pdf.js for rendering pages
    const pdfjsLib = await import("pdfjs-dist/build/pdf");

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js";

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const originalPdfBytes = await file.arrayBuffer();
    const originalPdf = await PDFDocument.load(originalPdfBytes);

    const newPdf = await PDFDocument.create();

    let scaleFactor = 0.6;

    if (quality === "low") scaleFactor = 0.35;
    if (quality === "medium") scaleFactor = 0.55;
    if (quality === "high") scaleFactor = 0.75;

    for (let i = 0; i < pdf.numPages; i++) {
      const compressedBlob = await renderPageToCompressedImage(pdf, i, scaleFactor);
      const imgBytes = await compressedBlob.arrayBuffer();
      const img = await newPdf.embedJpg(imgBytes);

      const page = newPdf.addPage([img.width, img.height]);
      page.drawImage(img, {
        x: 0,
        y: 0,
        width: img.width,
        height: img.height,
      });
    }

    const newPdfBytes = await newPdf.save();
    const newBlob = new Blob([newPdfBytes], { type: "application/pdf" });

    saveAs(newBlob, `${fileName}-compressed.pdf`);

    setLoading(false);
  }

  return (
    <>
      <Helmet>
        <title>Compress PDF – RocketPDF</title>
        <meta
          name="description"
          content="Reduce PDF file size online using RocketPDF’s free PDF compressor."
        />
      </Helmet>

      <div className="p-8 text-white">
        <h1 className="text-2xl font-bold mb-6">Compress PDF</h1>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          {/* Upload */}
          <label className="block border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-yellow-500 transition">
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const uploaded = e.target.files[0];
                if (!uploaded) return;
                setFile(uploaded);
                setFileName(uploaded.name.replace(".pdf", ""));
              }}
            />

            {!file ? (
              <p className="text-gray-400">Click to upload your PDF</p>
            ) : (
              <p className="text-green-400 font-medium">{fileName}.pdf</p>
            )}
          </label>

          {/* Compression Level */}
          <div className="mt-6">
            <label className="text-sm text-gray-300">Compression Level</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full mt-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg"
            >
              <option value="low">Low – Smallest Size</option>
              <option value="medium">Medium – Balanced</option>
              <option value="high">High – Best Quality</option>
            </select>
          </div>

          {/* Button */}
          <button
            onClick={handleCompress}
            disabled={!file || loading}
            className="mt-6 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg disabled:opacity-50"
          >
            {loading ? "Compressing..." : "Compress PDF"}
          </button>
        </div>
      </div>
    </>
  );
}
