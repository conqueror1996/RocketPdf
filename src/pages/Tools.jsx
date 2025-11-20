// /mnt/data/Tools.jsx
import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

import {
  ImageIcon,
  FileImage,
  FileText,
  Scissors,
  Lock,
  FileArchive,
} from "lucide-react";

export default function Tools() {
  const tools = [
    {
      title: "PNG → JPEG",
      path: "/png-to-jpeg",
      icon: <ImageIcon size={28} />,
      desc: "Convert PNG images to JPEG in seconds.",
    },
    {
      title: "Compress PDF",
      path: "/compress-pdf",
      icon: <FileArchive size={28} />,
      desc: "Reduce PDF size without losing quality.",
    },
    {
      title: "PDF → Word",
      path: "/pdf-to-word",
      icon: <FileText size={28} />,
      desc: "Turn PDF documents into Word (.docx).",
    },
    {
      title: "PDF → JPG",
      path: "/pdf-to-images",
      icon: <FileImage size={28} />,
      desc: "Convert PDF pages to JPG images.",
    },
    {
      title: "Delete Pages",
      path: "/delete-pages",
      icon: <Scissors size={28} />,
      desc: "Remove specific pages from a PDF.",
    },
    {
      title: "Images → PDF",
      path: "/img-to-pdf",
      icon: <FileImage size={28} />,
      desc: "Convert JPG/PNG images into a single PDF.",
    },
    {
      title: "Unlock PDF",
      path: "/unlock-pdf",
      icon: <Lock size={28} />,
      desc: "Remove password from protected PDFs using the correct password.",
    },
    // PDF Text Editor tool (correctly defined as an object, not JSX)
    {
      title: "Edit PDF Text",
      path: "/viewer",
      icon: <FileText size={28} />,
      desc: "Edit, add, resize, and remove text from your PDF.",
      // optional: you can set state here if you want Link to pass state
      // state: { file: null },
    },
  ];

  return (
    <>
      <Helmet>
        <title>All Tools – RocketPDF</title>
        <meta
          name="description"
          content="Browse all PDF tools including convert, compress, merge, split, and more."
        />
      </Helmet>

      <div className="p-8 text-white">
        <h1 className="text-3xl font-bold mb-6">All PDF Tools</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              state={tool.state ?? null}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 hover:bg-gray-750 transition group shadow-md hover:shadow-blue-500/20"
              aria-label={tool.title}
            >
              <div className="mb-4 text-blue-400 group-hover:text-blue-300 transition">
                {tool.icon}
              </div>

              <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
              <p className="text-sm text-gray-400">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
