"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ name: string; slug: string; image: string; manufacturer: string }[]>([]);
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
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary-content"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block">PluginDeals</span>
        </Link>

        {/* Search */}
        <div ref={searchRef} className="flex-1 relative max-w-xl">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search plugins, manufacturers…"
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
                  onClick={() => { setIsSearchOpen(false); setQuery(""); }}
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

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link href="/#deals" className="px-3 py-1.5 rounded-lg hover:bg-base-200 transition-colors text-base-content/70 hover:text-base-content">
            Deals
          </Link>
          <Link href="/#categories" className="px-3 py-1.5 rounded-lg hover:bg-base-200 transition-colors text-base-content/70 hover:text-base-content">
            Categories
          </Link>
        </nav>

        {/* Auth */}
        <div className="shrink-0 ml-auto md:ml-0">
          {session ? (
            <div className="dropdown dropdown-end">
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
          ) : (
            <button
              onClick={() => signIn("google")}
              className="btn btn-primary btn-sm gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
