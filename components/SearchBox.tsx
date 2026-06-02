"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Props {
  className?: string;
  inputClassName?: string;
}

export default function SearchBox({ className = "", inputClassName = "" }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { name: string; slug: string; image: string; manufacturer: string }[]
  >([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setIsSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSearch}>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 w-4 h-4 text-base-content/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search plugins"
            className={`input input-sm w-full pl-9 bg-base-200 border-base-300 focus:border-primary focus:outline-none rounded-lg placeholder:text-sm placeholder:text-base-content/40 ${inputClassName}`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
          />
        </div>
      </form>

      {isSearchOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-base-200 border border-base-300 rounded-xl shadow-2xl overflow-hidden z-50">
          {results.map((r) => (
            <Link
              key={r.slug}
              href={`/products/${r.slug}`}
              onClick={() => {
                setIsSearchOpen(false);
                setQuery("");
              }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-base-300 transition-colors"
            >
              <Image
                src={r.image}
                alt={r.name}
                width={36}
                height={36}
                className="rounded object-cover"
              />
              <div>
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-base-content/50">{r.manufacturer}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
