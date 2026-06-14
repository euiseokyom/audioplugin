"use client";

import { useSession, signIn } from "next-auth/react";
import { PAGE_CONTAINER } from "@/lib/layout";

export default function SectionSignIn() {
  const { data: session } = useSession();

  return (
    <section className="bg-base-300 border-t border-base-300">
      <div className={`${PAGE_CONTAINER} pt-12 pb-8 text-center space-y-4`}>
        <h2 className="text-xl font-bold text-base-content">
          Set alerts and save your favorites
        </h2>
        {session ? (
          <p className="text-sm text-base-content/70">
            Signed in as {session.user?.email}.
          </p>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-base-100 text-base-content font-semibold text-base hover:bg-base-200 active:scale-[0.98] transition-colors duration-150"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </section>
  );
}
