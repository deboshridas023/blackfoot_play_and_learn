import Navbar from "../components/navbar";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fffaf8] text-[#6b2020]">
      <Navbar />

      <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Flashcards Game */}
        <Link
          to="/games/flashcardthemes"
          className="bg-[#fff4f4] border border-[#b55656] rounded-lg p-6 flex flex-col items-center justify-center
                     hover:scale-105 hover:shadow-md hover:border-[#d4af37] hover:shadow-[#d4af37]/40
                     transition-transform duration-300 cursor-pointer"
        >
          <span className="text-5xl mb-3">🜁</span>
          <p className="text-[#a12222] font-serif text-lg font-semibold">Flashcards</p>
          <p className="text-[#6b2020]/80 text-sm italic mt-1">
            Build your language memory one card at a time.
          </p>
        </Link>

        {/* Placeholder Second Game */}
        <div
          className="bg-[#fceaea] border border-[#c5a2a2] rounded-lg p-6 flex flex-col items-center justify-center
                     cursor-not-allowed opacity-70"
        >
          <span className="text-5xl mb-3 opacity-70">🎮</span>
          <p className="text-[#a12222]/70 font-serif text-lg">Coming Soon</p>
        </div>
      </div>
    </div>
  );
}
