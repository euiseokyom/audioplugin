import Link from "next/link";

const CATEGORY_ICONS: Record<string, string> = {
  Synthesizer: "🎹",
  EQ: "🎚️",
  Compressor: "🎛️",
  Reverb: "🌊",
  Delay: "🔁",
  Mastering: "💿",
  Limiter: "📊",
  Saturation: "🔥",
  Sampler: "🥁",
  Bundle: "📦",
  Modular: "⚡",
  "Audio Repair": "🔧",
  "Sound Design": "🎨",
  "Sample Library": "🎵",
};

interface Props {
  categories: { name: string; count: number }[];
}

export default function SectionCategories({ categories }: Props) {
  return (
    <section id="categories" className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗂️</span>
          <h2 className="text-xl font-bold">Browse by Category</h2>
        </div>
        <div className="h-px flex-1 bg-base-300" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={`/category/${encodeURIComponent(cat.name.toLowerCase())}`}
            className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-base-200 border border-base-300 hover:border-primary/50 hover:bg-base-300 transition-all text-center"
          >
            <span className="text-2xl">{CATEGORY_ICONS[cat.name] ?? "🎧"}</span>
            <span className="text-xs font-medium leading-tight">{cat.name}</span>
            <span className="text-xs text-base-content/40">{cat.count}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
