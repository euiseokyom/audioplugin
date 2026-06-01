import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";

const MANUFACTURER_COLORS: Record<string, string> = {
  "Xfer Records": "from-violet-500/20 to-purple-500/20 border-violet-500/30",
  Spectrasonics: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  iZotope: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
  FabFilter: "from-orange-500/20 to-amber-500/20 border-orange-500/30",
  "Valhalla DSP": "from-pink-500/20 to-rose-500/20 border-pink-500/30",
  Arturia: "from-red-500/20 to-orange-500/20 border-red-500/30",
  "Native Instruments": "from-yellow-500/20 to-amber-500/20 border-yellow-500/30",
  Waves: "from-sky-500/20 to-blue-500/20 border-sky-500/30",
  Soundtoys: "from-indigo-500/20 to-violet-500/20 border-indigo-500/30",
  "Slate Digital": "from-gray-500/20 to-slate-500/20 border-gray-500/30",
  "Reveal Sound": "from-green-500/20 to-emerald-500/20 border-green-500/30",
  Krotos: "from-fuchsia-500/20 to-purple-500/20 border-fuchsia-500/30",
  "Slate + Ash": "from-teal-500/20 to-cyan-500/20 border-teal-500/30",
};

interface Props {
  manufacturers: { name: string; count: number }[];
}

export default function SectionManufacturers({ manufacturers }: Props) {
  return (
    <section id="manufacturers" className="space-y-5">
      <SectionHeader title="Browse by Manufacturer" />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {manufacturers.map((mfr) => {
          const colorClass =
            MANUFACTURER_COLORS[mfr.name] ??
            "from-base-300/50 to-base-200/50 border-base-300";
          return (
            <Link
              key={mfr.name}
              href={`/manufacturer/${encodeURIComponent(mfr.name.toLowerCase())}`}
              className={`group flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl bg-gradient-to-br border hover:scale-[1.02] transition-all ${colorClass}`}
            >
              <span className="text-sm font-semibold text-center leading-tight group-hover:text-primary transition-colors">
                {mfr.name}
              </span>
              <span className="text-xs text-base-content/40">{mfr.count} plugins</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
