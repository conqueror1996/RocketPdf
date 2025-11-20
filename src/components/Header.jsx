import React from 'react'


export default function Header() {
return (
<header className="bg-white border-b">
<div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="bg-indigo-600 text-white px-3 py-2 rounded-full font-bold">RP</div>
<div>
<div className="font-semibold">RocketPDF</div>
<div className="text-xs text-gray-500">Convert & manage PDFs</div>
</div>
</div>


<div className="flex items-center gap-3">
<button className="px-3 py-2 rounded bg-indigo-50 text-indigo-600">Upload</button>
<button className="px-3 py-2 rounded bg-gray-100">Sign in</button>
</div>
</div>
</header>
)
}