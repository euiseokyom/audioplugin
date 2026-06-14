import { Suspense } from "react";
import { getCategories } from "@/services/categories";
import { getManufacturers } from "@/services/manufacturers";
import SectionCategories from "@/components/SectionCategories";
import SectionManufacturers from "@/components/SectionManufacturers";
import SectionSignIn from "@/components/SectionSignIn";
import SearchBox from "@/components/SearchBox";
import HomeHotDealsSection from "@/components/HomeHotDealsSection";
import HomeEndsSoonSection from "@/components/HomeEndsSoonSection";
import HomeBundlesSection from "@/components/HomeBundlesSection";
import DealGridSkeleton from "@/components/DealGridSkeleton";
import { PAGE_CONTAINER } from "@/lib/layout";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Best Audio Plugin Deals & Price Tracker",
  description:
    "Find the hottest audio plugin deals, compare prices across 16 retailers, and track price drops — all in one place.",
  alternates: { canonical: absoluteUrl("/") },
};

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

export default async function HomePage() {
  const [categoriesResult, manufacturersResult] = await Promise.allSettled([
    getCategories(),
    getManufacturers(),
  ]);

  const categories = settled(categoriesResult, []);
  const manufacturers = settled(manufacturersResult, []);

  return (
    <>
      <div className={`${PAGE_CONTAINER} py-10 space-y-16`}>
        <div className="text-center space-y-4 py-6">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            <span className="block">Save Money on Plugins</span>
            <span className="block">Save Time Comparing Prices</span>
          </h1>
          <p className="text-base-content/60 max-w-xl mx-auto text-lg sm:text-2xl font-medium">
            Best audio plugin deals in one place.
          </p>
        </div>

        <SearchBox className="mx-auto w-full max-w-xl" inputClassName="input-md" />

        <Suspense
          fallback={
            <section className="space-y-5">
              <div className="h-8 w-32 rounded bg-base-300 animate-pulse" />
              <DealGridSkeleton className="pt-4" />
            </section>
          }
        >
          <HomeHotDealsSection />
        </Suspense>

        <Suspense
          fallback={
            <section className="space-y-5">
              <div className="h-8 w-32 rounded bg-base-300 animate-pulse" />
              <DealGridSkeleton className="pt-4" />
            </section>
          }
        >
          <HomeEndsSoonSection />
        </Suspense>

        <Suspense
          fallback={
            <section className="space-y-5">
              <div className="h-8 w-32 rounded bg-base-300 animate-pulse" />
              <DealGridSkeleton className="pt-4" />
            </section>
          }
        >
          <HomeBundlesSection />
        </Suspense>

        <SectionCategories categories={categories} />

        <SectionManufacturers manufacturers={manufacturers} />
      </div>

      <SectionSignIn />
    </>
  );
}
