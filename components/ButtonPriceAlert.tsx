"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

interface Props {
  productId: string;
  productName: string;
  currentLowestPrice: number;
  registeredPrice: number;
}

export default function ButtonPriceAlert({
  productId,
  productName,
  currentLowestPrice,
  registeredPrice,
}: Props) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState(
    Math.round(currentLowestPrice * 0.85 * 100) / 100
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);

  async function handleSetAlert() {
    if (!session) {
      signIn("google");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, targetPrice }),
      });
      if (!res.ok) throw new Error("Failed");
      setIsDone(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsDone(false);
      }, 2000);
    } catch {
      setError("Could not set alert. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => (session ? setIsOpen(true) : signIn("google"))}
          aria-label="Set price alert"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-base-content/30 bg-base-200 text-base-content hover:bg-base-300 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>

        <button
          onClick={() => setIsFavorited((prev) => !prev)}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-base-content/30 bg-base-200 text-base-content hover:bg-base-300 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={isFavorited ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-6 h-6 transition-colors ${isFavorited ? "text-red-500" : "text-base-content"}`}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-base-200 border border-base-300 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            {isDone ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-semibold">Alert set!</p>
                <p className="text-sm text-base-content/60 mt-1">
                  {"We'll notify you when the price drops."}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-base">Set Price Alert</h3>
                    <p className="text-xs text-base-content/50 mt-0.5 line-clamp-1">
                      {productName}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="btn btn-ghost btn-xs btn-circle"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-base-300 rounded-xl p-3">
                      <p className="text-xs text-base-content/50 mb-1">Regular Price</p>
                      <p className="font-semibold text-sm">${registeredPrice.toFixed(2)}</p>
                    </div>
                    <div className="bg-primary/10 rounded-xl p-3">
                      <p className="text-xs text-base-content/50 mb-1">Current Lowest</p>
                      <p className="font-semibold text-sm text-primary">
                        ${currentLowestPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-base-content/70 block mb-2">
                      Alert me when price drops below
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        min={0.99}
                        max={registeredPrice}
                        step={0.01}
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(parseFloat(e.target.value))}
                        className="input input-bordered w-full pl-7"
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-base-content/40">
                      <button
                        onClick={() => setTargetPrice(Math.round(registeredPrice * 0.5 * 100) / 100)}
                        className="hover:text-primary transition-colors"
                      >
                        50% off
                      </button>
                      <button
                        onClick={() => setTargetPrice(Math.round(registeredPrice * 0.7 * 100) / 100)}
                        className="hover:text-primary transition-colors"
                      >
                        30% off
                      </button>
                      <button
                        onClick={() => setTargetPrice(Math.round(registeredPrice * 0.8 * 100) / 100)}
                        className="hover:text-primary transition-colors"
                      >
                        20% off
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-error text-xs">{error}</p>}

                  <button
                    onClick={handleSetAlert}
                    disabled={isLoading || targetPrice <= 0}
                    className="btn btn-primary w-full"
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      "Set Alert"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
