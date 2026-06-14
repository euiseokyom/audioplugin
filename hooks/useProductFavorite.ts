"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";

export function useProductFavorite(
  productId: string,
  initialIsFavorited = false,
) {
  const { data: session, status } = useSession();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialIsFavorited) {
      setIsFavorited(true);
      return;
    }

    if (status !== "authenticated" || !session?.user?.id) {
      setIsFavorited(false);
      return;
    }

    let cancelled = false;

    async function loadFavoriteState() {
      try {
        const res = await fetch(`/api/favorites?productId=${productId}`);
        if (!res.ok) return;
        const data = (await res.json()) as { favorited?: boolean };
        if (!cancelled) setIsFavorited(!!data.favorited);
      } catch {
        // ignore
      }
    }

    loadFavoriteState();
    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id, productId, initialIsFavorited]);

  async function toggleFavorite() {
    if (!session) {
      signIn("google");
      return;
    }

    const nextFavorited = !isFavorited;
    setIsFavorited(nextFavorited);
    setIsLoading(true);

    try {
      const res = await fetch(
        nextFavorited ? "/api/favorites" : `/api/favorites/${productId}`,
        nextFavorited
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId }),
            }
          : { method: "DELETE" },
      );

      if (!res.ok) throw new Error("Failed");
    } catch {
      setIsFavorited(!nextFavorited);
    } finally {
      setIsLoading(false);
    }
  }

  return { isFavorited, isLoading, toggleFavorite };
}
