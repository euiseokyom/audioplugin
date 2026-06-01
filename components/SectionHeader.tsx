interface Props {
  title: string;
  subtitle?: string;
}

export default function SectionHeader({ title, subtitle }: Props) {
  return (
    <div className="w-screen relative left-1/2 -translate-x-1/2 text-white py-12 sm:py-12 text-center bg-[#080808] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_110%_150%_at_100%_0%,rgba(105,44,22,0.62)_0%,rgba(75,32,16,0.52)_30%,rgba(35,14,6,0.22)_55%,transparent_85%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_110%_150%_at_0%_0%,rgba(10,42,58,0.8)_0%,rgba(8,30,45,0.5)_30%,rgba(4,18,28,0.22)_55%,transparent_85%)]"
      />
      <div className="relative">
        <h2 className="font-inter text-5xl sm:text-5xl font-semibold tracking-normal">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm sm:text-base text-white/70 mt-1.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
