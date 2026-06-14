"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  alertId: string;
  targetPrice: number;
  lowestPrice: number;
  maxPrice: number;
  className?: string;
}

export default function AlertTargetField({
  alertId,
  targetPrice,
  lowestPrice,
  maxPrice,
  className = "",
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(targetPrice.toFixed(2));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(targetPrice.toFixed(2));
  }, [targetPrice]);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const numericValue = Number(value);

  async function save() {
    const nextPrice = Math.round(numericValue * 100) / 100;
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      setValue(targetPrice.toFixed(2));
      setError("Enter a valid price");
      setIsEditing(false);
      return;
    }
    if (nextPrice > maxPrice) {
      setValue(targetPrice.toFixed(2));
      setError(`Must be at or below $${maxPrice.toFixed(2)}`);
      setIsEditing(false);
      return;
    }

    setIsEditing(false);

    if (nextPrice === targetPrice) {
      setError("");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPrice: nextPrice }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      setValue(targetPrice.toFixed(2));
      setError("Could not save. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
    if (e.key === "Escape") {
      setValue(targetPrice.toFixed(2));
      setError("");
      setIsEditing(false);
    }
  }

  return (
    <div
      role="button"
      tabIndex={isEditing ? -1 : 0}
      onClick={() => !isEditing && !isSaving && setIsEditing(true)}
      onKeyDown={(e) => {
        if (!isEditing && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
      className={`min-w-0 rounded-lg sm:rounded-xl border border-green-600/50 bg-base-100 pl-3.5 pr-2.5 pt-1 pb-1.5 sm:px-3 sm:pt-1.5 sm:pb-2.5 text-left sm:text-right transition-colors ${
        isEditing ? "bg-base-300 cursor-text" : "hover:bg-base-300 cursor-pointer"
      } ${className}`}
    >
      <p className="text-[10px] sm:text-xs text-green-600 mb-0.5 sm:mb-1 leading-none text-left">
        Alert Target
      </p>

      {isEditing ? (
        <div className="relative flex items-center justify-start sm:inline-flex sm:justify-end min-w-0 w-full sm:w-auto">
          <span className="text-base sm:text-xl md:text-2xl font-bold text-green-600 mr-0.5">
            $
          </span>
          <input
            ref={inputRef}
            type="number"
            min={0.01}
            max={maxPrice}
            step={0.01}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            onBlur={save}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            disabled={isSaving}
            aria-label="Alert target price"
            className="w-full max-w-[4.5rem] sm:w-32 bg-transparent text-base sm:text-xl md:text-2xl font-bold text-green-600 text-left sm:text-right outline-none border-none p-0 disabled:opacity-60 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      ) : (
        <p className="text-base sm:text-xl md:text-2xl font-bold text-green-600 leading-none tabular-nums text-left">
          ${targetPrice.toFixed(2)}
          {isSaving && (
            <span className="loading loading-spinner loading-xs text-green-600 ml-1 inline-block align-middle" />
          )}
        </p>
      )}

      {error && (
        <p className="text-[10px] sm:text-xs text-error mt-0.5 sm:mt-1 leading-none text-left sm:text-right">
          {error}
        </p>
      )}
    </div>
  );
}
