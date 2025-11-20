// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import PDFToImages from "./pages/PDFToImages";
import OrganizePDF from "./pages/OrganizePDF";
import DeletePages from "./pages/DeletePages";
import CompressPDF from "./pages/CompressPDF";
import PDFToWord from "./pages/PDFToWord";
import PNGToJPEG from "./pages/PNGToJPEG";
import Tools from "./pages/Tools";
import Viewer from "./pages/Viewer";
import ImagesToPDF from "./pages/ImgToPDF";
import UnlockPDF from "./pages/UnlockPDF";

export default function App() {
  return (
    <Routes>
      {/* Layout wrapper */}
      <Route element={<DashboardLayout />}>

        {/* Home */}
        <Route path="/" element={<Dashboard />} />

        {/* Tools */}
        <Route path="/pdf-to-images" element={<PDFToImages />} />
        <Route path="/organize-pdf" element={<OrganizePDF />} />
        <Route path="/delete-pages" element={<DeletePages />} />
        <Route path="/compress-pdf" element={<CompressPDF />} />
        <Route path="/pdf-to-word" element={<PDFToWord />} />
        <Route path="/png-to-jpeg" element={<PNGToJPEG />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/img-to-pdf" element={<ImagesToPDF />} />
        <Route path="/unlock-pdf" element={<UnlockPDF />} />

        {/* Viewer */}
        <Route path="/viewer" element={<Viewer />} />

      </Route>
    </Routes>
  );
}
