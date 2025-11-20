import React from 'react'


export default function FileDropZone({ onFile = () => {}, progress = 0 }) {
return (
<label className="block">
<div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-white hover:border-indigo-200 cursor-pointer">
<div className="text-3xl">📄</div>
<div className="mt-2 font-medium">Drop your PDF here or click to upload</div>
<div className="text-sm text-gray-400 mt-1">Supports single PDF upload for preview & tools</div>
<input
type="file"
accept="application/pdf"
onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
className="hidden"
/>
</div>
</label>
)
}