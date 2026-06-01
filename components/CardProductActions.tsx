"use client";

import { useState } from "react";

export default function CardProductActions() {
  const [isAlerted, setIsAlerted] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [bellSwinging, setBellSwinging] = useState(false);

  function handleAlert(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsAlerted((prev) => !prev);
    setBellSwinging(true);
    setTimeout(() => setBellSwinging(false), 600);
  }

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited((prev) => !prev);
  }

  return (
    <div className="absolute top-2 right-2 flex flex-col gap-1.5">
      <button
        onClick={handleAlert}
        aria-label={isAlerted ? "Remove price alert" : "Set price alert"}
        className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isAlerted ? "white" : "none"}
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transformOrigin: "50% 10%" }}
          className={`w-3.5 h-3.5 ${bellSwinging ? "animate-bell-swing" : ""}`}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      <button
        onClick={handleFavorite}
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke={isFavorited ? "currentColor" : "white"}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-3.5 h-3.5 transition-colors duration-300 ${isFavorited ? "text-red-500" : "text-transparent"}`}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </div>
  );
}
