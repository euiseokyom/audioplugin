interface Props {
  title: string;
  subtitle?: string;
  pullUp?: boolean;
  plain?: boolean;
  compact?: boolean;
  divider?: boolean;
}

export default function SectionHeader({
  title,
  subtitle,
  pullUp,
  plain,
  compact,
  divider = false,
}: Props) {
  if (plain)
    return (
      <div
        className={`text-center${compact ? " pt-14 pb-3" : " pt-16 pb-5"}${pullUp ? " -mt-5" : ""}`}
      >
        {divider && (
          <hr className="border-t-2 border-base-content/35 mb-10" />
        )}
        <h2 className="antialiased font-inter text-4xl sm:text-4xl font-bold tracking-normal text-base-content">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm sm:text-base text-base-content/50 mt-1.5">
            {subtitle}
          </p>
        )}
      </div>
    );

  return (
    <div
      className={`w-screen relative left-1/2 -translate-x-1/2 text-white pt-16 pb-9 sm:pt-16 sm:pb-9 text-center bg-[#080808] overflow-hidden${pullUp ? " -mt-5" : ""}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_125%_155%_at_100%_0%,rgba(58,22,8,0.88)_0%,rgba(42,16,6,0.74)_32%,rgba(22,8,3,0.48)_60%,rgba(10,3,1,0.24)_85%,transparent_95%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_125%_155%_at_0%_0%,rgba(10,42,58,0.8)_0%,rgba(8,30,45,0.5)_32%,rgba(4,18,28,0.22)_60%,transparent_90%)]"
      />
      <div className="relative">
        <h2 className="antialiased font-inter text-4xl sm:text-4xl font-bold tracking-normal">
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
