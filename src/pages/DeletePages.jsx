import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";

export default function DeletePages() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [pagesToDelete, setPagesToDelete] = useState("");
  const [loading, setLoading] = useState(false);

  function parsePages(input) {
    const pages = new Set();
    const parts = input.split(",");

    for (let part of parts) {
      part = part.trim();

      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        for (let i = start; i <= end; i++) pages.add(i);
      } else {
        pages.add(Number(part));
      }
    }
    return pages;
  }

  async function handleDelete() {
    if (!file) return alert("Upload a PDF first.");
    if (!pagesToDelete.trim()) return alert("Enter pages to delete.");

    try {
      setLoading(true);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();

      const deleteSet = parsePages(pagesToDelete);
      const newPdf = await PDFDocument.create();

      for (let i = 0; i < totalPages; i++) {
        const pageNumber = i + 1;

        if (!deleteSet.has(pageNumber)) {
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(copiedPage);
        }
      }

      const newPdfBytes = await newPdf.save();
      const newBlob = new Blob([newPdfBytes], { type: "application/pdf" });

      saveAs(newBlob, `${fileName}-modified.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to delete pages.");
    }

    setLoading(false);
  }

  return (
    <>
      <Helmet>
        <title>Delete Pages from PDF – RocketPDF</title>
        <meta
          name="description"
          content="Remove unwanted pages from your PDF using RocketPDF."
        />
      </Helmet>

      <div className="p-8 text-white">
        <h1 className="text-2xl font-bold mb-6">Delete Pages from PDF</h1>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">

          {/* File Upload */}
          <label className="block border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-red-500 transition">
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

          {/* Input pages */}
          <div className="mt-6">
            <label className="text-sm text-gray-300">
              Pages to Delete (example: 1,3,5-7)
            </label>
            <input
              type="text"
              placeholder="e.g., 1,2,5-7"
              value={pagesToDelete}
              onChange={(e) => setPagesToDelete(e.target.value)}
              className="w-full mt-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg"
            />
          </div>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={!file || loading}
            className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
          >
            {loading ? "Processing..." : "Delete Pages"}
          </button>
        </div>
      </div>
    </>
  );
}
