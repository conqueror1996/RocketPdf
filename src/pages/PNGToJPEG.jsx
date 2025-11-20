import React, { useState } from "react";
import { Helmet } from "react-helmet";

export default function PNGToJPEG() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleConvert() {
    if (!file) return alert("Upload a PNG first!");

    setLoading(true);

    const img = new Image();
    img.src = preview;
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw PNG → Canvas
      ctx.drawImage(img, 0, 0);

      // Convert Canvas → JPEG Blob
      canvas.toBlob(
        (blob) => {
          const jpegName = file.name.replace(".png", ".jpg");
          const downloadUrl = URL.createObjectURL(blob);

          // Trigger Download
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = jpegName;
          link.click();

          URL.revokeObjectURL(downloadUrl);
          setLoading(false);
        },
        "image/jpeg",
        0.9 // quality (90%)
      );
    };
  }

  return (
    <>
      <Helmet>
        <title>PNG to JPEG Converter – RocketPDF</title>
        <meta
          name="description"
          content="Convert PNG images to JPEG format online for free using RocketPDF."
        />
      </Helmet>

      <div className="p-8 text-white">
        <h1 className="text-2xl font-bold mb-6">PNG → JPEG Converter</h1>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">

          {/* UPLOAD BOX */}
          <label className="block border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition">
            <input
              type="file"
              accept="image/png"
              className="hidden"
              onChange={(e) => {
                const uploaded = e.target.files[0];
                if (!uploaded) return;
                if (uploaded.type !== "image/png")
                  return alert("Only PNG images are allowed.");
                setFile(uploaded);
                setPreview(URL.createObjectURL(uploaded));
              }}
            />

            {!preview ? (
              <p className="text-gray-400">Click to upload a PNG image</p>
            ) : (
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto rounded-lg shadow-lg"
              />
            )}
          </label>

          {/* BUTTON */}
          <button
            onClick={handleConvert}
            disabled={!file || loading}
            className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {loading ? "Converting..." : "Convert to JPEG"}
          </button>
        </div>
      </div>
    </>
  );
}
