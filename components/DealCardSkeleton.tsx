export default function DealCardSkeleton() {
  return (
    <div className="card min-w-0 overflow-hidden rounded-lg animate-pulse">
      <figure className="relative aspect-square overflow-hidden bg-base-300 rounded-lg" />

      <div className="min-w-0 pt-3 pb-4 flex flex-col gap-0.5 px-2">
        <div className="h-3 w-1/3 rounded bg-base-300" />

        <div className="block min-w-0 flex flex-col gap-0.5">
          <div className="h-3.5 w-full rounded bg-base-300" />
          <div className="h-3.5 w-4/5 rounded bg-base-300" />

          <div className="mt-1 h-3 w-1/4 rounded bg-base-300 ml-auto" />

          <div className="mt-auto flex flex-col gap-0.5 min-w-0">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-1.5 gap-y-0 min-w-0">
              <div className="col-start-1 row-start-1 relative shrink-0">
                <div className="h-6 w-8 rounded bg-base-300" />
              </div>
              <div className="col-start-2 row-start-1 row-span-2 flex min-w-0 flex-col gap-0">
                <div className="h-5 w-16 rounded bg-base-300 ml-auto" />
                <div className="h-3.5 w-20 rounded bg-base-300 ml-auto mb-1" />
              </div>
              <div className="col-span-2 flex min-w-0 flex-col gap-0.5 mt-0.5">
                <div className="h-4 w-24 rounded bg-base-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
