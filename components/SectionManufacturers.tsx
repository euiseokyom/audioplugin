import Link from "next/link";
import { manufacturerToSlug } from "@/lib/manufacturer-slug";
import SectionHeader from "@/components/SectionHeader";

const MANUFACTURER_COLORS: Record<string, string> = {
  "Xfer Records": "bg-[#3b0764] hover:bg-[#4c0d8a]",
  Spectrasonics: "bg-[#1e3a5f] hover:bg-[#254875]",
  iZotope: "bg-[#064e3b] hover:bg-[#065f46]",
  FabFilter: "bg-[#7c2d12] hover:bg-[#9a3412]",
  "Valhalla DSP": "bg-[#831843] hover:bg-[#9d174d]",
  Arturia: "bg-[#7f1d1d] hover:bg-[#991b1b]",
  "Native Instruments": "bg-[#78350f] hover:bg-[#92400e]",
  Waves: "bg-[#1e3a8a] hover:bg-[#1d4ed8]",
  Soundtoys: "bg-[#312e81] hover:bg-[#3730a3]",
  McDSP: "bg-[#14532d] hover:bg-[#166534]",
  "Universal Audio": "bg-[#1e3a8a] hover:bg-[#1d4ed8]",
  "Plugin Alliance": "bg-[#27272a] hover:bg-[#3f3f46]",
  Softube: "bg-[#1e3a5f] hover:bg-[#254875]",
  Sonnox: "bg-[#4c1d95] hover:bg-[#5b21b6]",
  "Solid State Logic": "bg-[#1c1917] hover:bg-[#292524]",
  "Slate Digital": "bg-[#27272a] hover:bg-[#3f3f46]",
  Eventide: "bg-[#1e3a8a] hover:bg-[#1d4ed8]",
  "XLN Audio": "bg-[#7f1d1d] hover:bg-[#991b1b]",
  "Relab Development": "bg-[#4c1d95] hover:bg-[#5b21b6]",
  Antares: "bg-[#831843] hover:bg-[#9d174d]",
  "Baby Audio": "bg-[#134e4a] hover:bg-[#115e59]",
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
