export default function ProductPageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="lg:grid lg:grid-cols-[minmax(0,320px)_1fr_minmax(0,420px)] lg:gap-10 xl:gap-14 lg:items-start space-y-10 lg:space-y-0">
        <div className="grid grid-cols-[minmax(0,200px)_1fr] sm:grid-cols-[minmax(0,280px)_1fr] md:grid-cols-[minmax(260px,340px)_1fr] gap-4 sm:gap-6 md:gap-8 items-start lg:contents">
          <div className="aspect-square w-full min-w-0 rounded-2xl bg-base-300 border border-base-300" />

          <div className="flex flex-col gap-3 sm:gap-4 min-w-0 self-start text-right items-end">
            <div className="flex flex-col gap-2 w-full items-end">
              <div className="h-7 sm:h-9 w-3/4 rounded bg-base-300" />
              <div className="h-4 w-1/3 rounded bg-base-300" />
            </div>

            <div className="flex flex-col gap-3 items-end w-full">
              <div className="flex flex-col gap-1 items-end">
                <div className="h-3 w-16 rounded bg-base-300" />
                <div className="h-7 w-24 rounded bg-base-300" />
              </div>
              <div className="flex flex-col gap-1 items-end">
                <div className="h-3 w-20 rounded bg-base-300" />
                <div className="h-7 w-24 rounded bg-base-300" />
              </div>
              <div className="flex flex-col gap-1 items-end">
                <div className="h-3 w-16 rounded bg-base-300" />
                <div className="h-4 w-32 rounded bg-base-300" />
              </div>
            </div>

            <div className="h-10 w-36 rounded-lg bg-base-300" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-6 w-32 rounded bg-base-300" />
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-base-200 border border-base-300"
            >
              <div className="h-10 w-10 rounded-full bg-base-300 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded bg-base-300" />
                <div className="h-3 w-16 rounded bg-base-300" />
              </div>
              <div className="h-8 w-20 rounded bg-base-300" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 lg:mt-14 space-y-4">
        <div className="h-6 w-40 rounded bg-base-300" />
        <div className="h-48 w-full rounded-xl bg-base-300" />
      </div>
    </div>
  );
}
