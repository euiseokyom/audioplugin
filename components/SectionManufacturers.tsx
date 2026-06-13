import Link from "next/link";
import { manufacturerToSlug } from "@/lib/manufacturer-slug";
import SectionHeader from "@/components/SectionHeader";

const MANUFACTURER_COLORS: Record<string, string> = {
  "Xfer Records": "bg-[#3b0764] hover:bg-[#4c0d8a]",
  Spectrasonics: "bg-[#1e3a5f] hover:bg-[#254875]",
  iZotope: "bg-[#581c87] hover:bg-[#7e22ce]",
  FabFilter: "bg-[#7c2d12] hover:bg-[#9a3412]",
  "Valhalla DSP": "bg-[#831843] hover:bg-[#9d174d]",
  Arturia: "bg-[#7f1d1d] hover:bg-[#991b1b]",
  "Native Instruments": "bg-[#78350f] hover:bg-[#92400e]",
  Waves: "bg-[#1e3a8a] hover:bg-[#1d4ed8]",
  Soundtoys: "bg-[#6b4423] hover:bg-[#8b5a2b]",
  McDSP: "bg-[#14532d] hover:bg-[#166534]",
  "Universal Audio": "bg-[#78716c] hover:bg-[#a8a29e]",
  "Plugin Alliance": "bg-[#172554] hover:bg-[#1e3a8a]",
  "Mastering the Mix": "bg-[#155e75] hover:bg-[#0e7490]",
  "Newfangled Audio": "bg-[#a16207] hover:bg-[#ca8a04]",
  Softube: "bg-[#1e3a5f] hover:bg-[#254875]",
  Sonnox: "bg-[#0369a1] hover:bg-[#0284c7]",
  "Solid State Logic": "bg-[#047857] hover:bg-[#059669]",
  "Slate Digital": "bg-[#27272a] hover:bg-[#3f3f46]",
  Eventide: "bg-[#1e3a8a] hover:bg-[#1d4ed8]",
  "XLN Audio": "bg-[#7f1d1d] hover:bg-[#991b1b]",
  "Relab Development": "bg-[#4c1d95] hover:bg-[#5b21b6]",
  Antares: "bg-[#134e4a] hover:bg-[#115e59]",
  "Baby Audio": "bg-[#831843] hover:bg-[#9d174d]",
  "Reveal Sound": "bg-[#14532d] hover:bg-[#166534]",
  Krotos: "bg-[#701a75] hover:bg-[#86198f]",
  "Slate + Ash": "bg-[#134e4a] hover:bg-[#115e59]",
};

interface Props {
  manufacturers: { name: string; count: number }[];
}

export default function SectionManufacturers({ manufacturers }: Props) {
  const sorted = [...manufacturers].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <section id="manufacturers" className="space-y-5">
      <SectionHeader title="Browse by Manufacturer" pullUp plain />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
        {sorted.map((mfr) => {
          const colorClass =
            MANUFACTURER_COLORS[mfr.name] ?? "bg-[#27272a] hover:bg-[#3f3f46]";
          return (
            <Link
              key={mfr.name}
              href={`/manufacturer/${manufacturerToSlug(mfr.name)}`}
              className={`block aspect-square rounded-xl transition-colors ${colorClass}`}
            >
              <span className="flex h-full w-full items-center justify-center p-5 text-center text-lg sm:text-xl font-bold text-base-100 leading-tight">
                {mfr.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
