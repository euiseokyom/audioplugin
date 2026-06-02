import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PluginBargains — Best Audio Plugin Deals & Price Tracker",
  description:
    "Track the best deals on audio plugins. Compare prices across 16 retailers, set price drop alerts, and never overpay for your favorite plugins again.",
  keywords: [
    "audio plugins",
    "plugin deals",
    "VST deals",
    "plugin price tracker",
  ],
  openGraph: {
    title: "PluginBargains — Best Audio Plugin Deals & Price Tracker",
    description:
      "Compare plugin prices across 16 retailers and set price drop alerts.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="corporate">
      <body
        className={`${inter.variable} font-sans bg-base-100 text-base-content min-h-screen overflow-x-hidden flex flex-col`}
      >
        <AuthProvider>
          <div className="flex flex-col flex-1 min-h-0">
            <Navbar />
            <main className="flex-1 bg-base-100">{children}</main>
            <footer className="bg-base-300 py-10">
              <div className="max-w-7xl mx-auto px-4 text-center text-base-content/40 text-sm">
                <p>PluginBargains — Track prices. Set alerts. Save money.</p>
                <p className="mt-1">
                  Prices are updated daily. Some links are affiliate links.
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
