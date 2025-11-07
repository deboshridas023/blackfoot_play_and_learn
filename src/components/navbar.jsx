import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

export default function Navbar() {
  const navigate = useNavigate();

  const handleExit = async () => {
    await signOut(auth);
    navigate("/");  // Go to home page after logout
  };

  return (
    <nav className="w-full bg-[#c54b4b] text-[#fffaf8] py-4 flex justify-between items-center px-6 shadow-md">
      <h1 className="text-2xl font-serif tracking-wider">Blackfoot · Play & Learn</h1>
      <button
        onClick={handleExit}
        className="px-4 py-1 border border-[#d4af37] text-[#d4af37] rounded hover:bg-[#d4af37]/20 transition-all duration-200"
      >
        Logout
      </button>
    </nav>
  );
}
