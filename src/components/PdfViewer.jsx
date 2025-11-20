import React from 'react'


export default function PdfViewer({ file }) {
return (
<div className="p-6">
<div className="text-sm text-gray-500">Preview</div>
<div className="mt-4 p-6 bg-white rounded shadow-sm">
<div className="text-sm">{file.name}</div>
<div className="text-xs text-gray-400 mt-2">(This is a simple file-name preview. Connect a PDF renderer when you are ready.)</div>
</div>
</div>
)
}