import { getHotDeals, getEndsSoonDeals } from "@/services/products";
import { getCategories } from "@/services/categories";
import { getManufacturers } from "@/services/manufacturers";
import SectionHotDeals from "@/components/SectionHotDeals";
import SectionEndsSoon from "@/components/SectionEndsSoon";
import SectionCategories from "@/components/SectionCategories";
import SectionManufacturers from "@/components/SectionManufacturers";
import SectionSignIn from "@/components/SectionSignIn";

export const revalidate = 3600;

export default async function HomePage() {
  const [hotDeals, endsSoon, categories, manufacturers] = await Promise.all([
    getHotDeals(8),
    getEndsSoonDeals(8),
    getCategories(),
    getManufacturers(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4 py-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Save Money on Plugins
          <br className="hidden sm:block" />
          Stop Wasting Time Comparing
        </h1>
        <p className="text-base-content/60 max-w-xl mx-auto text-2xl font-medium">
          Best audio plugin deals in one place.
        </p>
      </div>

      <SectionHotDeals products={hotDeals.data} />

      <SectionEndsSoon products={endsSoon.data} />

      <SectionCategories categories={categories} />

      <SectionManufacturers manufacturers={manufacturers} />

      <SectionSignIn />
    </div>
  );
}
