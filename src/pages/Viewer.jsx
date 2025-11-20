// src/pages/Viewer.jsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js";

function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 9);
}

export default function Viewer() {
  const location = useLocation();
  const passedFile = location.state?.file || null;

  // CORE STATES
  const [pdfFile, setPdfFile] = useState(passedFile);
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);

  // MODES
  const [isEditing, setIsEditing] = useState(false); // edit existing text
  const [addTextMode, setAddTextMode] = useState(false); // add text boxes
  const [addTextSize, setAddTextSize] = useState(14); // default size for new boxes

  // Edited existing PDF text changes (keeps references to spans)
  const [editedPdfTextChanges, setEditedPdfTextChanges] = useState([]);

  // Annotations (added text boxes) as source-of-truth
  // annotation: { id, text, x, y, width, height, fontSize, page, isNew }
  const [annotations, setAnnotations] = useState([]);

  // History stacks for undo/redo (only for annotations actions)
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Refs
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const overlayRef = useRef(null); // container to hold annotation DOMs

  // Drag/resize active refs
  const activeRef = useRef({}); // { id, type: 'move'|'resize', handle, startX, startY, orig }

  // LOAD PDF
  useEffect(() => {
    if (!pdfFile) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const arr = new Uint8Array(reader.result);
      const loadedPdf = await pdfjsLib.getDocument(arr).promise;
      setPdf(loadedPdf);
      setCurrentPage(1);
    };
    reader.readAsArrayBuffer(pdfFile);
  }, [pdfFile]);

  // RENDER PAGE WHEN PDF or currentPage or scale changes
  useEffect(() => {
    if (pdf) renderPage(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf, currentPage, scale, isEditing]);

  // Render PDF page into canvas + text layer
  async function renderPage(pageNum) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Render pdfjs text layer
    const textLayerDiv = textLayerRef.current;
    textLayerDiv.innerHTML = "";

    const textContent = await page.getTextContent();

    const textLayer = new pdfjsViewer.TextLayerRenderTask({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport,
      textDivs: [],
    });

    textLayer.render().promise.then(() => {
      const spans = textLayerDiv.querySelectorAll("span");
      spans.forEach((span) => {
        span.style.cursor = isEditing ? "pointer" : "default";
        span.onclick = (e) => {
          if (!isEditing) return;
          e.preventDefault();
          enterEditExistingText(span);
        };
      });
    });

    // Re-render annotation overlay positions/sizes (they are in PDF coords)
    renderAnnotationsOverlay();
  }

  // Convert canvas overlay coordinates to PDF coords and back
  function pdfToCanvasCoords(pdfX, pdfY) {
    // pdfX/pdfY stored in PDF units (user units) relative to page
    // To display, multiply by scale and offset by canvasRect.top/left
    const canvasRect = canvasRef.current.getBoundingClientRect();
    return {
      left: canvasRect.left + pdfX * scale,
      top: canvasRect.bottom - pdfY * scale, // because PDF origin at bottom-left
    };
  }

  function canvasToPdfCoords(clientX, clientY) {
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - canvasRect.left) / scale;
    const y = (canvasRect.bottom - clientY) / scale;
    return { x, y };
  }

  // ---------- Existing PDF text editing ----------
  function enterEditExistingText(span) {
    // inline edit existing text via input placed over span
    const rect = span.getBoundingClientRect();
    const input = document.createElement("input");
    input.type = "text";
    input.value = span.textContent;
    Object.assign(input.style, {
      position: "absolute",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      fontSize: window.getComputedStyle(span).fontSize,
      background: "white",
      color: "black",
      padding: "2px 4px",
      border: "1px solid #333",
      zIndex: 9999,
    });
    document.body.appendChild(input);
    input.focus();

    const finish = () => {
      const newValue = input.value;
      span.textContent = newValue;

      setEditedPdfTextChanges((prev) => [
        ...prev,
        { span, newText: newValue, page: currentPage },
      ]);
      document.body.removeChild(input);
    };
    input.onblur = finish;
    input.onkeydown = (e) => e.key === "Enter" && finish();
  }

  // ---------- Annotations overlay rendering ----------
  // Keep annotation DOM synced with annotations state
  function renderAnnotationsOverlay() {
    const overlay = overlayRef.current;
    if (!overlay) return;

    // Clear overlay; we'll re-create elements from annotations state
    overlay.innerHTML = "";

    const canvasRect = canvasRef.current.getBoundingClientRect();

    annotations
      .filter((a) => a.page === currentPage)
      .forEach((a) => {
        const left = canvasRect.left + a.x * scale;
        const top = canvasRect.bottom - (a.y + a.height) * scale; // y stored as bottom-based? We'll use top-left visually
        const width = a.width * scale;
        const height = a.height * scale;

        // Create wrapper div
        const box = document.createElement("div");
        box.className = "rp-annotation";
        box.dataset.id = a.id;
        Object.assign(box.style, {
          position: "absolute",
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
          background: "transparent",
          color: "#000",
          cursor: "move",
          zIndex: 9998,
          boxSizing: "border-box",
        });

        // inner content (text)
        const content = document.createElement("div");
        content.contentEditable = false; // editing via dblclick
        content.innerText = a.text;
        Object.assign(content.style, {
          fontSize: `${a.fontSize}px`,
          lineHeight: "1",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          whiteSpace: "pre-wrap",
          userSelect: "none",
        });

        // create handles (8)
        const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
        handles.forEach((h) => {
          const hd = document.createElement("div");
          hd.className = `rp-handle rp-h-${h}`;
          Object.assign(hd.style, {
            position: "absolute",
            width: "10px",
            height: "10px",
            background: "#fff",
            border: "1px solid #333",
            boxSizing: "border-box",
            zIndex: 9999,
            borderRadius: "2px",
          });
          // position per handle
          if (h.includes("n")) hd.style.top = "-6px";
          if (h.includes("s")) hd.style.bottom = "-6px";
          if (h.includes("w")) hd.style.left = "-6px";
          if (h.includes("e")) hd.style.right = "-6px";
          if (h === "n" || h === "s") hd.style.left = "50%";
          if (h === "e" || h === "w") hd.style.top = "50%";
          if (h === "n" || h === "s") hd.style.transform = "translateX(-50%)";
          if (h === "e" || h === "w") hd.style.transform = "translateY(-50%)";

          // attach pointerdown to handle
          hd.addEventListener("pointerdown", (ev) => {
            ev.stopPropagation();
            startInteraction(a.id, "resize", h, ev);
          });

          box.appendChild(hd);
        });

        // drag start
        box.addEventListener("pointerdown", (ev) => {
          ev.stopPropagation();
          startInteraction(a.id, "move", null, ev);
        });

        // double click to edit
        content.addEventListener("dblclick", (ev) => {
          ev.stopPropagation();
          startEditingAnnotation(a.id);
        });

        box.appendChild(content);
        overlay.appendChild(box);
      });
  }

  // Start interaction for drag/resize
  function startInteraction(id, type, handle, ev) {
    ev.preventDefault();
    const ann = annotations.find((x) => x.id === id);
    if (!ann) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();

    activeRef.current = {
      id,
      type, // move or resize
      handle,
      startX: ev.clientX,
      startY: ev.clientY,
      orig: { ...ann }, // copy original
      canvasRect,
    };

    // pointer capture on document to track moves
    const onPointerMove = (e) => interactionMove(e);
    const onPointerUp = (e) => {
      interactionEnd(e);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }

  function interactionMove(e) {
    const act = activeRef.current;
    if (!act || !act.id) return;
    const deltaX = e.clientX - act.startX;
    const deltaY = e.clientY - act.startY;

    setAnnotations((prev) =>
      prev.map((a) => {
        if (a.id !== act.id) return a;
        const canvasRect = act.canvasRect;
        if (act.type === "move") {
          // compute new top-left in canvas pixels, convert to pdf coords
          const left = canvasRect.left + a.x * scale + deltaX;
          const top = canvasRect.bottom - (a.y + a.height) * scale + deltaY;
          // convert to PDF coords
          const newX = (left - canvasRect.left) / scale;
          const newY = (canvasRect.bottom - top) / scale - a.height;
          return { ...a, x: newX, y: newY };
        } else if (act.type === "resize") {
          // handle resizing: adjust width/height, and scale font size (Option A)
          const { handle } = act;
          // original dims in px at time of start
          const orig = act.orig;
          // compute new width/height in px
          let newWidthPx = orig.width * scale;
          let newHeightPx = orig.height * scale;
          let leftPx = act.canvasRect.left + orig.x * scale;
          let topPx = act.canvasRect.bottom - (orig.y + orig.height) * scale;

          // apply based on handle
          if (handle.includes("e")) newWidthPx = Math.max(20, orig.width * scale + deltaX);
          if (handle.includes("s")) newHeightPx = Math.max(12, orig.height * scale - deltaY);
          if (handle.includes("w")) {
            newWidthPx = Math.max(20, orig.width * scale - deltaX);
            leftPx = leftPx + deltaX;
          }
          if (handle.includes("n")) {
            newHeightPx = Math.max(12, orig.height * scale + deltaY);
            topPx = topPx - deltaY;
          }

          const newWidth = newWidthPx / scale;
          const newHeight = newHeightPx / scale;

          // Option A: font size scales with width (simple proportional)
          const newFontSize = Math.max(6, (orig.fontSize * newWidth) / orig.width);

          return { ...a, width: newWidth, height: newHeight, fontSize: newFontSize, x: (leftPx - act.canvasRect.left) / scale, y: (act.canvasRect.bottom - topPx) / scale - newHeight };
        }
        return a;
      })
    );
  }

  function interactionEnd(e) {
    const act = activeRef.current;
    if (!act || !act.id) return;
    // push action to undo stack (we capture previous and new state)
    const before = act.orig;
    const after = annotations.find((a) => a.id === act.id);
    if (before && after) {
      pushUndo({
        type: act.type === "move" ? "move" : "resize",
        id: act.id,
        before,
        after: { ...after },
      });
      // clear redo
      setRedoStack([]);
    }
    activeRef.current = {};
  }

  function pushUndo(entry) {
    setUndoStack((prev) => [...prev, entry]);
  }

  // Undo/Redo operations apply to annotation actions only
  function handleUndo() {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    // revert annotation to last.before
    setAnnotations((prev) => prev.map((a) => (a.id === last.id ? { ...last.before } : a)));
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, last]);
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setAnnotations((prev) => prev.map((a) => (a.id === last.id ? { ...last.after } : a)));
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, last]);
  }

  // Double-click edit annotation text
  function startEditingAnnotation(id) {
    const ann = annotations.find((a) => a.id === id);
    if (!ann) return;

    // locate annotation DOM and its internal content element
    const overlay = overlayRef.current;
    if (!overlay) return;
    const box = overlay.querySelector(`[data-id="${id}"]`);
    if (!box) return;
    const content = box.querySelector("div");

    // create input positioned over content
    const rect = content.getBoundingClientRect();
    const input = document.createElement("textarea");
    Object.assign(input.style, {
      position: "absolute",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      fontSize: `${ann.fontSize}px`,
      zIndex: 10000,
      padding: "4px",
      margin: 0,
    });
    input.value = ann.text;
    document.body.appendChild(input);
    input.focus();

    const finish = () => {
      const newText = input.value;
      setAnnotations((prev) => prev.map((x) => (x.id === id ? { ...x, text: newText } : x)));
      // push to undo stack as an 'edit' action
      pushUndo({ type: "editText", id, before: { ...ann }, after: { ...ann, text: newText } });
      setRedoStack([]);
      document.body.removeChild(input);
    };

    input.onblur = finish;
    input.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        input.blur();
      }
    };
  }

  // Add a new annotation when user clicks in addTextMode
  function addAnnotationAt(clientX, clientY) {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const { x, y } = canvasToPdfCoords(clientX, clientY);

    // default width/height in pdf units (user units)
    const defaultWidth = 120 / scale;
    const defaultHeight = 24 / scale;

    const newAnn = {
      id: uid("ann_"),
      isNew: true,
      text: "New Text",
      x,
      y,
      width: defaultWidth,
      height: defaultHeight,
      fontSize: addTextSize,
      page: currentPage,
    };

    setAnnotations((prev) => [...prev, newAnn]);
    // push action to undo stack
    pushUndo({ type: "add", id: newAnn.id, before: null, after: { ...newAnn } });
    setRedoStack([]);
  }

  // handle click on canvas for addText mode
  function handleCanvasClick(e) {
    if (!addTextMode) return;
    // if clicked on an overlay element, do nothing (we want clicks on canvas)
    addAnnotationAt(e.clientX, e.clientY);
  }

  // Remove annotation (delete)
  function deleteAnnotation(id) {
    const ann = annotations.find((a) => a.id === id);
    if (!ann) return;
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    pushUndo({ type: "delete", id, before: { ...ann }, after: null });
    setRedoStack([]);
  }

  // SAVE: merge editedPdfTextChanges (existing text edits) and annotations
  async function saveEditedPDF() {
    if (!pdfFile) return alert("No PDF loaded");

    // Load original
    const origBytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(origBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // First apply existing-pdf-text edits (we used span references)
    for (const change of editedPdfTextChanges) {
      try {
        // best effort: we white-out the old span area and write new text at same rect
        const span = change.span;
        if (!span) continue;
        const rect = span.getBoundingClientRect();
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const pageIdx = change.page - 1;
        const pdfPage = pdfDoc.getPage(pageIdx);

        const x = (rect.left - canvasRect.left) / scale;
        const y = (canvasRect.bottom - rect.bottom) / scale;
        const width = rect.width / scale;
        const height = rect.height / scale;

        // erase
        pdfPage.drawRectangle({ x, y, width, height, color: rgb(1, 1, 1) });

        // draw
        if (change.newText.trim() !== "") {
          const fontSize = parseFloat(window.getComputedStyle(span).fontSize) / scale;
          pdfPage.drawText(change.newText, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        }
      } catch (err) {
        console.warn("Failed to apply existing text change", err);
      }
    }

    // Now apply annotations (added boxes)
    for (const ann of annotations) {
      if (ann.page - 1 >= pdfDoc.getPageCount()) continue;
      const pdfPage = pdfDoc.getPage(ann.page - 1);

      // We want to draw text inside the box; we'll draw at (ann.x, ann.y) bottom-left
      // adjust because our ann.y is the bottom coordinate
      pdfPage.drawText(ann.text, {
        x: ann.x,
        y: ann.y,
        size: ann.fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }

    const editedBytes = await pdfDoc.save();
    const blob = new Blob([editedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "edited.pdf";
    a.click();
    URL.revokeObjectURL(url);

    alert("Saved edited PDF");
  }

  // UI helpers
  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") return alert("Upload a valid PDF");
    setPdfFile(f);
    // reset state
    setAnnotations([]);
    setEditedPdfTextChanges([]);
    setUndoStack([]);
    setRedoStack([]);
  }

  // When annotations state changes, re-render overlay DOM
  useEffect(() => {
    renderAnnotationsOverlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations, currentPage, scale]);

  // Return UI
  return (
    <>
      <Helmet>
        <title>PDF Viewer – RocketPDF</title>
        <meta name="description" content="Advanced PDF editor with add text, resize, drag, undo/redo" />
      </Helmet>

      <div className="p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">PDF Viewer</h1>

        {!pdfFile && (
          <div className="bg-gray-800 p-6 rounded-xl text-center">
            <label className="cursor-pointer">
              <input hidden type="file" accept="application/pdf" onChange={onFileChange} />
              <div className="text-gray-300">Click to upload PDF</div>
            </label>
          </div>
        )}

        {pdfFile && (
          <div className="flex items-center gap-4 mb-4">
            <button className="px-4 py-2 bg-blue-600 rounded-lg" onClick={() => setIsEditing((s) => !s)}>
              {isEditing ? "Exit Edit Mode" : "Edit Text"}
            </button>

            <button className="px-4 py-2 bg-purple-600 rounded-lg" onClick={() => setAddTextMode((s) => !s)}>
              {addTextMode ? "Cancel Add Text" : "Add Text"}
            </button>

            {addTextMode && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                <button className="px-2 bg-gray-700 rounded" onClick={() => setAddTextSize((s) => Math.max(6, s - 1))}>
                  A-
                </button>
                <span className="text-gray-300">{addTextSize}px</span>
                <button className="px-2 bg-gray-700 rounded" onClick={() => setAddTextSize((s) => Math.min(200, s + 1))}>
                  A+
                </button>
              </div>
            )}

            <button className="px-3 py-2 bg-gray-700 rounded-lg" onClick={handleUndo}>
              Undo
            </button>
            <button className="px-3 py-2 bg-gray-700 rounded-lg" onClick={handleRedo}>
              Redo
            </button>

            <button className="px-3 py-2 bg-gray-700 rounded-lg" onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}>
              −
            </button>
            <button className="px-3 py-2 bg-gray-700 rounded-lg" onClick={() => setScale((s) => Math.min(3, s + 0.2))}>
              +
            </button>

            <button disabled={currentPage === 1} className="px-3 py-2 bg-gray-700 rounded-lg" onClick={() => setCurrentPage((p) => p - 1)}>
              Prev
            </button>
            <button disabled={!pdf || currentPage === pdf.numPages} className="px-3 py-2 bg-gray-700 rounded-lg" onClick={() => setCurrentPage((p) => p + 1)}>
              Next
            </button>

            <button className="px-4 py-2 bg-green-600 rounded-lg" onClick={saveEditedPDF}>
              Save PDF
            </button>
          </div>
        )}

        {/* Viewer area */}
        {pdfFile && (
          <div className="relative inline-block bg-black/20 p-2 rounded-lg" onClick={handleCanvasClick}>
            <canvas ref={canvasRef} style={{ display: "block" }} />
            {/* PDF.js text layer */}
            <div ref={textLayerRef} className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: isEditing ? "auto" : "none", color: isEditing ? "yellow" : "transparent" }} />

            {/* overlay container (annotations) - positioned by renderAnnotationsOverlay */}
            <div ref={overlayRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "auto" }} />
          </div>
        )}
      </div>
    </>
  );
}
