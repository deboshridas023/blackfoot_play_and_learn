import Navbar from "../components/navbar";
import {Link} from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#2c241f] text-white">
      <Navbar />
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  
  {/* Flashcards Game */}
  <Link
  to="/games/flashcardthemes"
  className="bg-[#f4ead5]/90 border border-[#6b4e3d] rounded-lg p-6 flex flex-col items-center justify-center
             hover:scale-105 hover:shadow-lg hover:border-[#d4af37] hover:shadow-[#d4af37]/30
             transition cursor-pointer"
>
  {/* TEMP medieval style icon placeholder */}
  <span className="text-5xl mb-3">🜁</span>
  <p className="text-[#6b4e3d] font-serif text-lg">Flashcards</p>
  <p className="text-[#6b4e3d]/80 text-sm italic mt-1">
    Build your language memory one card at a time.
  </p>
</Link>


  {/* Placeholder Second Game */}
  <div className="bg-[#f4ead5]/40 border border-[#6b4e3d]/40 rounded-lg p-6 flex flex-col items-center justify-center 
                  cursor-not-allowed">

    <span className="text-5xl mb-3 opacity-50">🎮</span>
    <p className="text-[#6b4e3d]/60 font-serif text-lg">Coming Soon</p>
  </div>

</div>
    </div>
  );
}
