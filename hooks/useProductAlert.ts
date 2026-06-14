"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";

interface AlertState {
  _id: string;
  targetPrice: number;
}

export function useProductAlert(productId: string, defaultTargetPrice: number) {
  const { data: session, status } = useSession();
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAlert = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) {
      setAlert(null);
      return;
    }

    try {
      const res = await fetch(`/api/alerts?productId=${productId}`);
      if (!res.ok) return;
      const data = (await res.json()) as { alert?: AlertState | null };
      setAlert(data.alert ?? null);
    } catch {
      // ignore
    }
  }, [status, session?.user?.id, productId]);

  useEffect(() => {
    loadAlert();
  }, [loadAlert]);

  async function createAlert(targetPrice: number) {
    if (!session) {
      signIn("google");
      return false;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, targetPrice }),
      });
      if (!res.ok) throw new Error("Failed");
      await loadAlert();
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function removeAlert() {
    if (!session || !alert) return false;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/alerts/${alert._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setAlert(null);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleAlert() {
    if (!session) {
      signIn("google");
      return;
    }

    if (alert) {
      await removeAlert();
      return;
    }

    await createAlert(defaultTargetPrice);
  }

  return {
    alert,
    hasAlert: alert != null,
    isLoading,
    createAlert,
    removeAlert,
    toggleAlert,
    reloadAlert: loadAlert,
  };
}
