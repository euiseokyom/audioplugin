import DealCardSkeleton from "@/components/DealCardSkeleton";

export const DEAL_GRID_CLASS =
  "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-start gap-3 sm:gap-4";

interface Props {
  count?: number;
  className?: string;
}

export default function DealGridSkeleton({ count = 8, className = "" }: Props) {
  return (
    <div className={`${DEAL_GRID_CLASS} ${className}`.trim()}>
      {[...Array(count)].map((_, i) => (
        <DealCardSkeleton key={i} />
      ))}
    </div>
  );
}
