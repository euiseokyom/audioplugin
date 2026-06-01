"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();
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
    <header className="sticky top-0 z-50 bg-base-100/90 backdrop-blur-md border-b border-base-300">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-inter font-bold text-lg tracking-tight shrink-0"
        >
          PluginBargains
        </Link>

        <div className="flex items-center gap-4 ml-auto">
          <div
            ref={searchRef}
            className="relative w-full max-w-xs sm:max-w-sm md:max-w-md"
          >
            <form onSubmit={handleSearch}>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40"
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
                  className="input input-sm w-full pl-9 bg-base-200 border-base-300 focus:border-primary focus:outline-none rounded-lg"
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
                      <p className="text-xs text-base-content/50">
                        {r.manufacturer}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {session && (
            <div className="dropdown dropdown-end shrink-0">
              <div tabIndex={0} role="button" className="avatar cursor-pointer">
                <div className="w-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1">
                  <Image
                    src={session.user?.image ?? "/default-avatar.png"}
                    alt={session.user?.name ?? "User"}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </div>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-200 rounded-xl z-[1] w-52 p-2 shadow-2xl border border-base-300 mt-2"
              >
                <li className="menu-title px-2 py-1 text-xs text-base-content/50">
                  {session.user?.email}
                </li>
                <li>
                  <Link href="/alerts">My Alerts</Link>
                </li>
                {session.user?.isAdmin && (
                  <li>
                    <Link href="/admin">Admin</Link>
                  </li>
                )}
                <li>
                  <button onClick={() => signOut()}>Sign Out</button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
