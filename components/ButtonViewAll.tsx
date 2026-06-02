interface Props {
  href: string;
}

export default function ButtonViewAll({ href }: Props) {
  return (
    <div className="flex justify-center pt-4">
      <a
        href={href}
        className="inline-flex items-center justify-center gap-2 px-24 py-3.5 bg-neutral text-base-100 font-bold text-base sm:text-lg tracking-wide  transition-colors duration-150 hover:bg-base-content"
      >
        VIEW MORE
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
