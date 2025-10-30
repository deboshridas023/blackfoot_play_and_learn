// src/games/flashcardthemes.jsx
import { Link } from "react-router-dom";

const THEMES = [
  { slug: "animals", title: "Animals", tagline: "Creatures great & small" },
  { slug: "emotions", title: "Emotions", tagline: "Feelings & expressions" },
  { slug: "body-parts", title: "Body Parts", tagline: "Head to toe" },
  { slug: "seasons", title: "Seasons", tagline: "Spring · Summer · Fall · Winter" },
  { slug: "senses", title: "Senses", tagline: "See · Hear · Smell · Taste · Touch" },
];

// Soft watercolor icon (drawn placeholder) — size adapts via className
function WatercolorIcon({ className }) {
  return (
    <svg
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* blur defs */}
      <defs>
        <filter id="blur5" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <radialGradient id="wcA" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#d8c7a0" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#b5986b" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#8c6e4f" stopOpacity="0.6" />
        </radialGradient>
        <radialGradient id="wcB" cx="40%" cy="60%" r="65%">
          <stop offset="0%" stopColor="#f2e6c8" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#c2a57d" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6a4f3d" stopOpacity="0.45" />
        </radialGradient>
      </defs>

      {/* layered blobby strokes */}
      <g filter="url(#blur5)">
        <ellipse cx="60" cy="60" rx="44" ry="34" fill="url(#wcA)" />
        <ellipse cx="52" cy="58" rx="28" ry="22" fill="url(#wcB)" />
        <path
          d="M25,70 C40,85 80,88 96,66 C92,50 74,40 58,42 C42,44 28,54 25,70 Z"
          fill="#9d7d5e"
          opacity="0.35"
        />
      </g>

      {/* rough paper grain specks */}
      <g opacity="0.2">
        <circle cx="30" cy="34" r="2" fill="#705742" />
        <circle cx="78" cy="28" r="1.6" fill="#705742" />
        <circle cx="92" cy="74" r="1.8" fill="#705742" />
        <circle cx="46" cy="88" r="1.4" fill="#705742" />
      </g>
    </svg>
  );
}

export default function FlashcardThemes() {
  return (
    <div
      className="min-h-screen w-full text-[#d4c7a1]"
      style={{
        // BG-B: parchment texture + subtle vignette
        backgroundImage:
          "linear-gradient(rgba(30,22,18,0.90), rgba(30,22,18,0.92)), url('https://www.transparenttextures.com/patterns/aged-paper.png')",
        backgroundSize: "auto",
      }}
    >
      {/* Page max width */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* H1 title */}
        <h1 className="text-3xl sm:text-4xl font-serif tracking-wide text-[#e8d9b3] drop-shadow-[0_1px_0_rgba(0,0,0,0.7)] mb-6">
          Choose a Theme
        </h1>
        <p className="text-sm sm:text-base text-[#cbb895]/90 mb-10">
          Flashcards crafted to help preserve and celebrate the Blackfoot language.
        </p>

        {/* Vertical stack of tall cards (S1) */}
        <div className="space-y-5">
          {THEMES.map((t) => (
            <Link
              key={t.slug}
              to={`/games/flashcards/${t.slug}`}
              className="
                group block
                rounded-2xl border border-[#6b513f]/50
                bg-[#2a1f18]/70
                hover:bg-[#2f231b]/80
                shadow-[0_6px_20px_rgba(0,0,0,0.35)]
                hover:shadow-[0_10px_26px_rgba(0,0,0,0.45)]
                transition-all duration-200
                ring-0 hover:ring-1 hover:ring-[#d4af37]/40
              "
            >
              {/* CARD-A: horizontal layout with big icon left, text right */}
              <div className="flex items-center gap-5 px-4 sm:px-6 py-5 sm:py-6">
                {/* Icon well */}
                <div
                  className="
                    shrink-0
                    w-20 h-20 sm:w-24 sm:h-24
                    rounded-xl
                    bg-[#3b2a21]/80
                    border border-[#6b513f]/60
                    relative overflow-hidden
                  "
                >
                  {/* subtle corner shine */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/5 via-transparent to-black/10" />
                  {/* watercolor icon (I2 + P1) */}
                  <WatercolorIcon className="w-full h-full p-2" />
                </div>

                {/* Text block */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h2
                      className="
                        text-xl sm:text-2xl font-serif tracking-wide
                        text-[#e9dbb6] group-hover:text-[#f1e5c7]
                        transition-colors
                      "
                    >
                      {t.title}
                    </h2>

                    {/* small “badge” accent */}
                    <span
                      className="
                        text-[11px] uppercase tracking-wider
                        text-[#d4af37] border border-[#d4af37]/50
                        rounded px-2 py-[2px]
                        bg-[#463324]/40
                      "
                    >
                      Flashcards
                    </span>
                  </div>

                  <p className="mt-1 text-sm sm:text-base text-[#cbb895]/90">
                    {t.tagline}
                  </p>
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex shrink-0 items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#d4af37] opacity-80 group-hover:translate-x-0.5 transition-transform"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
