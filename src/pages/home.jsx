import Navbar from "../components/navbar";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fffaf8] text-[#6b2020]">
      <Navbar />

      {/* 3 columns × 2 rows grid, all cards same height */}
      <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">

        {/* History */}
        <Link
          to="/history"
          className="bg-[#fff7e0] border border-[#d4af37] rounded-lg p-6 
                     flex flex-col justify-start h-72
                     hover:shadow-md hover:shadow-[#d4af37]/40 hover:-translate-y-1
                     transition-all duration-300 cursor-pointer"
        >
          <span className="text-6xl mb-4">📜</span>

          <p className="text-[#a12222] font-serif text-2xl font-semibold text-left">
            Blackfoot History
          </p>

          <p className="text-[#6b2020]/80 text-sm italic mt-2 text-left leading-relaxed">
            Learn about the stories, culture, and traditions of the Blackfoot people.
            Explore timelines, places, and important events beyond language games.
          </p>

          <p className="mt-3 text-xs uppercase tracking-wide text-[#6b2020]/70">
            Cultural Section
          </p>
        </Link>

        {/* Flashcards */}
        <Link
          to="/games/flashcardthemes"
          className="bg-[#fff4f4] border border-[#b55656] rounded-lg p-6 
                     flex flex-col items-center justify-center h-72
                     hover:scale-105 hover:shadow-md hover:border-[#d4af37] hover:shadow-[#d4af37]/40
                     transition-transform duration-300 cursor-pointer"
        >
          <span className="text-5xl mb-3">🜁</span>
          <p className="text-[#a12222] font-serif text-lg font-semibold">Flashcards</p>
          <p className="text-[#6b2020]/80 text-sm italic mt-1 text-center">
          Learn a little every day, the Blackfoot way.
          </p>
        </Link>

        {/* Fill in the Gap */}
        <Link
          to="/games/fillinthegap"
          className="bg-[#fff4f4] border border-[#b55656] rounded-lg p-6 
                     flex flex-col items-center justify-center h-72
                     hover:scale-105 hover:shadow-md hover:border-[#d4af37] hover:shadow-[#d4af37]/40
                     transition-transform duration-300 cursor-pointer"
        >
          <span className="text-5xl mb-3">📝</span>
          <p className="text-[#a12222] font-serif text-lg font-semibold">Blackfoot Builder</p>
          <p className="text-[#6b2020]/80 text-sm italic mt-1 text-center">
          Piece together meaning, one word at a time.
          </p>
        </Link>

        {/* Leaderboard */}
        <Link
          to="/leaderboard"
          className="bg-[#fff7e0] border border-[#d4af37] rounded-lg p-6 
                     flex flex-col items-center justify-center h-72
                     hover:scale-105 hover:shadow-md hover:border-[#d4af37] hover:shadow-[#d4af37]/40
                     transition-transform duration-300 cursor-pointer"
        >
          <span className="text-5xl mb-3">🏆</span>
          <p className="text-[#a12222] font-serif text-lg font-semibold">Leaderboard</p>
          <p className="text-[#6b2020]/80 text-sm italic mt-1 text-center">
            See top scores across games.
          </p>
        </Link>

        {/* Voices of the Blackfoot */}
        <Link
          to="/games/shortstorieslist"
          className="bg-[#fff4f4] border border-[#b55656] rounded-lg p-6 
                     flex flex-col items-center justify-center h-72
                     hover:scale-105 hover:shadow-md hover:border-[#d4af37] hover:shadow-[#d4af37]/40
                     transition-transform duration-300 cursor-pointer"
        >
          <span className="text-5xl mb-3">🪶</span>
          <p className="text-[#a12222] font-serif text-lg font-semibold">
            Voices of the Blackfoot
          </p>
          <p className="text-[#6b2020]/80 text-sm italic mt-1 text-center">
            Listen to stories and guess the dialect like a language detective.
          </p>
        </Link>

        {/* Quiz */}
        <Link
          to="/games/quiz"
          className="bg-[#fff4f4] border border-[#b55656] rounded-lg p-6 
                     flex flex-col items-center justify-center h-72
                     hover:scale-105 hover:shadow-md hover:border-[#d4af37] hover:shadow-[#d4af37]/40
                     transition-transform duration-300 cursor-pointer"
        >
          <span className="text-5xl mb-3">🎮</span>
          <p className="text-[#a12222] font-serif text-lg font-semibold">Quiz</p>
          <p className="text-[#6b2020]/80 text-sm italic mt-1 text-center">
            Questions and Answers.
          </p>
        </Link>

      </div>

      {/* Acknowledgements bar */}
      <div className="w-full bg-[#fffaf0] border-t border-[#d4af37]/70 py-4 px-6">
        <div className="max-w-6xl mx-auto text-center text-[#6b2020]/80 text-sm">
          <span className="font-semibold text-[#a12222]">Acknowledgements & Sources:</span>{" "}
          Historical and language information draws on Blackfoot community language and cultural initiatives; scholarship on Niitsíʼpowahsin and Blackfoot history; and educational/public reference materials.{" "}
          <span className="uppercase text-xs tracking-wide text-[#6b2020]/70">
            With deep respect to Blackfoot elders, speakers, and knowledge keepers.
          </span>
        </div>
      </div>

    </div>
  );
}
