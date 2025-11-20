import React, { useState } from "react";
import { Helmet } from "react-helmet";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { convertPdfToImages } from "../utils/pdfToImage";

export default function PDFToImages() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);

  async function handleConvert() {
    if (!file) return alert("Upload a PDF first!");

    setLoading(true);

    // Convert PDF → array of { page, blob }
    const results = await convertPdfToImages(file);

    setImages(results);

    // Create ZIP
    const zip = new JSZip();
    results.forEach((item) => {
      zip.file(`page-${item.page}.jpg`, item.blob);
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });

    saveAs(zipBlob, `${fileName}-images.zip`);
    setLoading(false);
  }

  return (
    <>
      <Helmet>
        <title>PDF to JPG Converter – RocketPDF</title>
        <meta
          name="description"
          content="Convert PDF pages to JPG images online for free."
        />
      </Helmet>

      <div className="p-8 text-white">
        <h1 className="text-2xl font-bold mb-6">PDF to Images</h1>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">

          {/* FILE UPLOADER */}
          <label className="block border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition">
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
              <p className="text-gray-400">Click to upload a PDF</p>
            ) : (
              <p className="text-green-400 font-medium">{fileName}</p>
            )}
          </label>

          {/* CONVERT BUTTON */}
          <button
            onClick={handleConvert}
            disabled={!file || loading}
            className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {loading ? "Converting..." : "Convert PDF → Images"}
          </button>

          {images.length > 0 && (
            <p className="mt-4 text-green-400">
              {images.length} pages converted successfully ✓
            </p>
          )}
        </div>
      </div>
    </>
  );
}
