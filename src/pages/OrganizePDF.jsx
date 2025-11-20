import React, { useState } from "react";
import { Helmet } from "react-helmet";

export default function OrganizePDF() {
  const [pages, setPages] = useState([]);
  const [fileName, setFileName] = useState("");

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Upload a PDF file.");
      return;
    }

    setFileName(file.name);

    const fakePages = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      rotation: 0,
    }));

    setPages(fakePages);
  }

  function rotatePage(id) {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  }

  function deletePage(id) {
    setPages((prev) => prev.filter((p) => p.id !== id));
  }

  function moveUp(id) {
    const idx = pages.findIndex((p) => p.id === id);
    if (idx === 0) return;

    const newPages = [...pages];
    [newPages[idx - 1], newPages[idx]] = [newPages[idx], newPages[idx - 1]];
    setPages(newPages);
  }

  function moveDown(id) {
    const idx = pages.findIndex((p) => p.id === id);
    if (idx === pages.length - 1) return;

    const newPages = [...pages];
    [newPages[idx + 1], newPages[idx]] = [newPages[idx], newPages[idx + 1]];
    setPages(newPages);
  }

  return (
    <>
      <Helmet>
        <title>Organize PDF Pages – RocketPDF</title>
        <meta
          name="description"
          content="Reorder, rotate, and delete PDF pages using RocketPDF's online PDF organizer."
        />
      </Helmet>

      <div className="p-8 text-white">
        <h1 className="text-2xl font-bold mb-6">Organize PDF</h1>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg mb-8">
          <label className="block border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-yellow-500 transition">
            <input type="file" className="hidden" accept="application/pdf" onChange={handleUpload} />
            {!fileName ? (
              <p className="text-gray-400">Click to upload a PDF</p>
            ) : (
              <p className="text-green-400 font-medium">{fileName}</p>
            )}
          </label>
        </div>

        {pages.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-4">Reorder & Edit Pages</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-md"
                >
                  <div className="h-40 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-sm mb-4">
                    Page {page.id}
                    <br />
                    <span className="text-xs">Rotated: {page.rotation}°</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm"
                      onClick={() => rotatePage(page.id)}
                    >
                      Rotate
                    </button>

                    <button
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
                      onClick={() => deletePage(page.id)}
                    >
                      Delete
                    </button>

                    <button
                      className="px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-sm"
                      onClick={() => moveUp(page.id)}
                    >
                      Move Up
                    </button>

                    <button
                      className="px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-sm"
                      onClick={() => moveDown(page.id)}
                    >
                      Move Down
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-8 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold">
              Save New PDF
            </button>
          </>
        )}
      </div>
    </>
  );
}
