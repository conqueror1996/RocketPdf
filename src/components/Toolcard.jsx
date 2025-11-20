export default function ToolCard({ title, desc }) {
    return (
      <div className="p-6 rounded-xl bg-[#111317] border border-white/5 hover:border-blue-600 cursor-pointer transition">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-white/60">{desc}</p>
      </div>
    );
  }
  