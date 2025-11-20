import React, { useState } from "react";
import { Helmet } from "react-helmet";

export default function PDFToWord() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [email, setEmail] = useState("");

  function handleFileUpload(e) {
    const uploaded = e.target.files[0];
    if (!uploaded) return;
    if (uploaded.type !== "application/pdf") return alert("Invalid PDF format.");

    setFile(uploaded);
    setFileName(uploaded.name);
  }

  function handleConvert() {
    if (!file) return alert("Upload PDF first!");

    alert("Converting PDF → Word (.docx)...");
  }

  return (
    <>
      <Helmet>
        <title>PDF to Word Converter – RocketPDF</title>
        <meta
          name="description"
          content="Convert PDF files into editable Word documents using RocketPDF."
        />
      </Helmet>

      <div className="p-8 text-white">
        <h1 className="text-2xl font-bold mb-6">PDF to Word</h1>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <label className="block border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition">
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />

            {!file ? (
              <p className="text-gray-400">Click to upload your PDF</p>
            ) : (
              <p className="text-green-400 font-medium">{fileName}</p>
            )}
          </label>

          <button
            onClick={handleConvert}
            className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Convert to Word
          </button>
        </div>
      </div>
    </>
  );
}
