import React from 'react'


const items = ['Editor', 'Tools', 'History', 'Settings']


export default function Sidebar() {
return (
<aside className="w-60 hidden md:block bg-gray-50 border-r">
<div className="p-4 space-y-3">
{items.map((it) => (
<div key={it} className="p-2 rounded hover:bg-white cursor-pointer">{it}</div>
))}
</div>
</aside>
)
}