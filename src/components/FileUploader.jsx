// src/components/FileUploader.jsx
import React, { useCallback, useRef, useState } from "react";
import { saveAs } from "file-saver";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function FileUploader({ onFileLoaded }) {
  const [fileName, setFileName] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const processFile = useCallback(async (file) => {
    if (!file) return;
    setLoading(true);
    setFileName(file.name);
    setThumbnails([]);
    setNumPages(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setNumPages(pdf.numPages);
      // generate lightweight first-page thumbnail and optionally more pages
      const thumbs = [];
      const maxThumbPages = Math.min(3, pdf.numPages);
      for (let p = 1; p <= maxThumbPages; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs.push(canvas.toDataURL("image/png"));
      }
      setThumbnails(thumbs);

      // make a lightweight PDF URL for embedding/preview
      const blob = new Blob([arrayBuffer], { type: file.type || "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);

      // callback to parent (Dashboard) so it can render an embed preview, set current document, etc.
      onFileLoaded && onFileLoaded({ fileName: file.name, blob, blobUrl, numPages: pdf.numPages, arrayBuffer });

    } catch (err) {
      console.error("Failed to load PDF", err);
      alert("Failed to read this PDF file. (Check console for details)");
    } finally {
      setLoading(false);
    }
  }, [onFileLoaded]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const onSelect = useCallback((e) => {
    const f = e.target.files && e.target.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const extractText = useCallback(async (arrayBuffer) => {
    if (!arrayBuffer) return alert("No document loaded");
    setLoading(true);
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const strings = content.items.map((it) => it.str);
        fullText += strings.join(" ") + "\n\n";
      }
      // download as .txt
      const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
      saveAs(blob, (fileName || "document").replace(/\.[^/.]+$/, "") + ".txt");
    } catch (err) {
      console.error("Text extraction failed", err);
      alert("Failed to extract text (see console).");
    } finally {
      setLoading(false);
    }
  }, [fileName]);

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="application/pdf" onChange={onSelect} className="hidden" />
        <div className="text-center">
          <div className="font-medium">Drop your PDF here or click to upload</div>
          <div className="text-sm text-slate-500">Supports single PDF upload for preview & tools</div>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md" onClick={() => inputRef.current?.click()}>Choose file</button>
          <button
            className="px-3 py-2 border rounded-md"
            onClick={async (e) => {
              e.stopPropagation();
              if (!inputRef.current?.files?.[0]) return alert("Pick a file first");
              // reprocess the currently selected file
              processFile(inputRef.current.files[0]);
            }}
          >
            Reprocess
          </button>
        </div>

        <div className="mt-3 flex gap-3 items-center">
          <div className="text-sm text-slate-600">{loading ? "Loading..." : fileName || "No file chosen"}</div>
          {numPages ? <div className="text-sm text-slate-400"> · {numPages} pages</div> : null}
        </div>

        {thumbnails.length > 0 && (
          <div className="mt-4 flex gap-2">
            {thumbnails.map((src, i) => (
              <img key={i} src={src} className="w-20 h-28 object-cover rounded-md border" alt={`thumb-${i}`} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={async () => {
            // we rely on parent previously saving arrayBuffer in onFileLoaded. If parent hasn't, ask user to upload.
            const evt = new CustomEvent("request-extract-text");
            window.dispatchEvent(evt);
          }}
          className="px-3 py-2 bg-slate-100 rounded-md"
        >
          Extract Text (.txt)
        </button>

        <button
          onClick={() => {
            const evt = new CustomEvent("request-preview-open");
            window.dispatchEvent(evt);
          }}
          className="px-3 py-2 border rounded-md"
        >
          Open Preview
        </button>
      </div>
    </div>
  );
}
