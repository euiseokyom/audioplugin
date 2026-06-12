"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import SearchBox from "@/components/SearchBox";
import { PAGE_CONTAINER } from "@/lib/layout";

export default function Navbar() {
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 0);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-base-100/90 backdrop-blur-md transition-[border-color] ${
        isScrolled ? "border-b border-base-300" : "border-b-0"
      }`}
    >
      <div
        className={`${PAGE_CONTAINER} h-16 flex items-center justify-between gap-4`}
      >
        <Link
          href="/"
          className="antialiased font-inter font-bold text-lg tracking-tight shrink-0"
        >
          PluginBargains
        </Link>

        <div className="flex items-center gap-4 ml-auto">
          {!isHomePage && (
            <SearchBox className="w-full max-w-xs sm:max-w-sm md:max-w-md" />
          )}

          {session && (
            <div className="dropdown dropdown-end shrink-0">
              <div tabIndex={0} role="button" className="avatar cursor-pointer">
                <div className="w-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1 overflow-hidden bg-base-300 flex items-center justify-center text-xs font-bold">
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user?.name ?? "User"}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <span aria-hidden>
                      {(session.user?.name ?? "U").charAt(0).toUpperCase()}
                    </span>
                  )}
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
