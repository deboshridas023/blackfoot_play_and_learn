import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom"; 

const THEMES = [
  { slug: "animals", title: "Animals", tagline: "Creatures great & small" },
  { slug: "days", title: "Days of the Week", tagline: "The journey of the week" },
  { slug: "body-parts", title: "Body Parts", tagline: "Head to toe" },
  { slug: "clothing", title: "Clothing", tagline: "Made to be worn" }
];

function WatercolorIcon({ className }) {
  return (
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <filter id="blur5" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <radialGradient id="wcA" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fce4d6" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#f5b6a0" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#e07575" stopOpacity="0.6" />
        </radialGradient>
        <radialGradient id="wcB" cx="40%" cy="60%" r="65%">
          <stop offset="0%" stopColor="#fff3ee" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#f4b2a2" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#d56b5b" stopOpacity="0.45" />
        </radialGradient>
      </defs>

      <g filter="url(#blur5)">
        <ellipse cx="60" cy="60" rx="44" ry="34" fill="url(#wcA)" />
        <ellipse cx="52" cy="58" rx="28" ry="22" fill="url(#wcB)" />
      </g>
    </svg>
  );
}

export default function FlashcardThemes() {
  const navigate = useNavigate();
  const handleLogout = async () => {
      await signOut(auth);
    };
  const handleexit = async () => {
    navigate("/"); 
  };
  return (
    <div
      className="min-h-screen w-full text-[#6b2020]"
      style={{
        backgroundColor: "#fffaf8",
        backgroundImage: "url('https://www.transparenttextures.com/patterns/paper-fibers.png')",
        backgroundSize: "auto",
      }}
    >
     {/* Top Red Header Bar */}
<div className="bg-[#c54b4b] py-4 shadow-md">
  <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
    
    {/* Left: Title and Subtitle */}
    <div>
      <h1 className="text-4xl sm:text-5xl font-serif text-[#fffaf8] tracking-wide mb-1 drop-shadow-md">
        Choose a Theme
      </h1>
      <p className="text-sm sm:text-base text-[#fffaf8]/90">
        Flashcards crafted to help preserve and celebrate the Blackfoot language.
      </p>
    </div>

    {/* ✅ Right: Buttons side by side */}
    <div className="flex items-center gap-3">
      <button
        onClick={handleexit}
        className="px-4 py-1 border border-[#d4af37] text-[#d4af37] font-medium
        rounded hover:bg-[#b55656] hover:text-white transition-all duration-200"
      >
        Exit Game & Return Home
      </button>

      <button
        onClick={handleLogout}
        className="px-4 py-1 border border-[#d4af37] text-[#d4af37] font-medium
        rounded hover:bg-[#b55656] hover:text-white transition-all duration-200"
      >
        Logout
      </button>
    </div>
  </div>
</div>



      {/* Themes List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="space-y-5">
          {THEMES.map((t) => (
            <Link
              key={t.slug}
              to={`/games/flashcards/${t.slug}`}
              className="
                group block
                rounded-2xl border border-[#e09393]
                bg-[#fff4f4]/90
                hover:bg-[#ffe8e8]/95
                shadow-[0_4px_12px_rgba(197,75,75,0.25)]
                hover:shadow-[0_8px_20px_rgba(197,75,75,0.35)]
                transition-all duration-300
                hover:ring-1 hover:ring-[#c54b4b]/60
              "
            >
              <div className="flex items-center gap-5 px-4 sm:px-6 py-5 sm:py-6">
                <div
                  className="
                    shrink-0
                    w-20 h-20 sm:w-24 sm:h-24
                    rounded-xl
                    bg-[#ffe2e2]
                    border border-[#d98c8c]
                    relative overflow-hidden
                  "
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-[#f4b6b6]/20" />
                  <WatercolorIcon className="w-full h-full p-2" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h2
                      className="
                        text-xl sm:text-2xl font-serif tracking-wide
                        text-[#a12222] group-hover:text-[#c54b4b]
                        transition-colors
                      "
                    >
                      {t.title}
                    </h2>
                    <span
                      className="
                        text-[11px] uppercase tracking-wider
                        text-[#6b2020]
                        border border-[#d4af37]/50
                        rounded px-2 py-[2px]
                        bg-[#fdf4c2]
                      "
                    >
                      Flashcards
                    </span>
                  </div>
                  <p className="mt-1 text-sm sm:text-base text-[#6b2020]/80">{t.tagline}</p>
                </div>

                <div className="hidden sm:flex shrink-0 items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#c54b4b] opacity-80 group-hover:translate-x-0.5 transition-transform"
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
