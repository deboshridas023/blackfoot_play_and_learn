import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar() {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="w-full px-6 py-3 flex justify-between items-center
      bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]
      bg-[#3b2a21]/95 shadow-md border-b border-[#6b513f]">
      
      {/* Title */}
      <h1 className="text-2xl font-serif tracking-wider text-[#d4af37] select-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
        Blackfoot · Play & Learn
      </h1>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="px-4 py-1 border border-[#d4af37] text-[#d4af37] font-medium
        rounded hover:bg-[#d4af37]/20 transition-all duration-200"
      >
        Logout
      </button>
    </nav>
  );
}
