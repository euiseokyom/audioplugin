interface Props {
  href: string;
}

export default function ButtonViewAll({ href }: Props) {
  return (
    <div className="flex justify-center pt-1">
      <a
        href={href}
        className="inline-flex items-center justify-center gap-2.5 px-12 py-5 bg-black text-white font-bold text-lg sm:text-xl hover:bg-neutral-900 transition-colors"
      >
        View all
        <svg
          className="h-[0.65em] w-[0.45em] shrink-0"
          viewBox="0 0 10 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M1 1 9 7 1 13" />
        </svg>
      </a>
    </div>
  );
}
