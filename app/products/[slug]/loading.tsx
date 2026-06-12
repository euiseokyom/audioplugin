import ProductPageSkeleton from "@/components/ProductPageSkeleton";
import { PAGE_CONTAINER } from "@/lib/layout";

export default function ProductLoading() {
  return (
    <div className={`${PAGE_CONTAINER} py-12 lg:py-16`}>
      <ProductPageSkeleton />
    </div>
  );
}
