import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";

export default function ImgToPDF() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  function handleFiles(e) {
    const files = Array.from(e.target.files);

    const valid = files.filter((f) =>
      ["image/jpeg", "image/png"].includes(f.type)
    );

    if (valid.length === 0) return alert("Upload JPG or PNG images only.");

    const previews = valid.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...previews]);
  }

  function moveUp(index) {
    if (index === 0) return;
    const newArr = [...images];
    [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    setImages(newArr);
  }

  function moveDown(index) {
    if (index === images.length - 1) return;
    const newArr = [...images];
    [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
    setImages(newArr);
  }

  async function convertToPDF() {
    if (images.length === 0) return alert("Upload images first.");

    setLoading(true);

    const pdf = await PDFDocument.create();

    for (let item of images) {
      const fileBytes = await item.file.arrayBuffer();
      const img = await pdf.embedJpg(fileBytes).catch(async () => {
        const pngBytes = await item.file.arrayBuffer();
        return await pdf.embedPng(pngBytes);
      });

      const page = pdf.addPage([img.width, img.height]);
      page.drawImage(img, {
        x: 0,
        y: 0,
        width: img.width,
        height: img.height,
      });
    }

    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    saveAs(blob, "images-to-pdf.pdf");
    setLoading(false);
  }

  return (
    <>
      <Helmet>
        <title>Images to PDF Converter – RocketPDF</title>
        <meta
          name="description"
          content="Convert JPG and PNG images to a single PDF online for free using RocketPDF."
        />
      </Helmet>

      <div className="p-8 text-white">
        <h1 className="text-2xl font-bold mb-6">Images → PDF</h1>

        {/* Upload Box */}
        <label className="block border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition">
          <input
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
          <p className="text-gray-400">Click to upload JPG or PNG images</p>
        </label>

        {/* Preview & Reorder */}
        {images.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((img, index) => (
              <div
                key={index}
                className="bg-gray-900 p-4 border border-gray-700 rounded-xl shadow-lg"
              >
                <img
                  src={img.url}
                  alt="preview"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />

                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg"
                    onClick={() => moveUp(index)}
                  >
                    ↑ Up
                  </button>
                  <button
                    className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg"
                    onClick={() => moveDown(index)}
                  >
                    ↓ Down
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Convert Button */}
        {images.length > 0 && (
          <button
            onClick={convertToPDF}
            disabled={loading}
            className="mt-8 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
          >
            {loading ? "Converting..." : "Convert to PDF"}
          </button>
        )}
      </div>
    </>
  );
}
