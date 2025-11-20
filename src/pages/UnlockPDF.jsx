import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";

export default function UnlockPDF() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUnlock() {
    if (!file) return alert("Upload a locked PDF first.");
    if (!password.trim()) return alert("Enter the correct password.");

    try {
      setLoading(true);

      const arrayBuffer = await file.arrayBuffer();

      // Load locked PDF using password
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        password: password,
      });

      // Save new PDF with NO password
      const newPdfBytes = await pdfDoc.save();
      const blob = new Blob([newPdfBytes], { type: "application/pdf" });

      saveAs(blob, `${fileName}-unlocked.pdf`);
    } catch (error) {
      alert("Incorrect password or file is corrupted.");
    }

    setLoading(false);
  }

  return (
    <>
      <Helmet>
        <title>Unlock PDF – RocketPDF</title>
        <meta
          name="description"
          content="Remove password protection from PDF files by providing the correct password. Secure and private."
        />
      </Helmet>

      <div className="p-8 text-white">
        <h1 className="text-2xl font-bold mb-6">Unlock PDF (Remove Password)</h1>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          {/* Upload locked PDF */}
          <label className="block border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 transition">
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
              <p className="text-gray-400">Click to upload a password-protected PDF</p>
            ) : (
              <p className="text-green-400 font-medium">{fileName}.pdf</p>
            )}
          </label>

          {/* Password Input */}
          <div className="mt-6">
            <label className="text-sm text-gray-300">Enter Password</label>
            <input
              type="password"
              placeholder="PDF password"
              className="w-full mt-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Unlock Button */}
          <button
            onClick={handleUnlock}
            disabled={!file || loading}
            className="mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50"
          >
            {loading ? "Unlocking..." : "Unlock PDF"}
          </button>
        </div>
      </div>
    </>
  );
}
