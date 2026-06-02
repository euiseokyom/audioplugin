import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";

interface Props {
  categories: { name: string; count: number }[];
}

export default function SectionCategories({ categories }: Props) {
  const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section id="categories" className="space-y-5">
      <SectionHeader title="Browse by Category" pullUp plain />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-5">
        {sorted.map((cat) => (
          <Link
            key={cat.name}
            href={`/category/${encodeURIComponent(cat.name.toLowerCase())}`}
            className="block aspect-square rounded-xl bg-[#404040] hover:bg-[#525252] transition-colors"
          >
            <span className="flex h-full w-full items-center justify-center p-4 text-center text-lg sm:text-xl font-bold text-base-100 leading-tight">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
