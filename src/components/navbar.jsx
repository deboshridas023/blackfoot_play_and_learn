import { signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

export default function Navbar() {
  const navigate = useNavigate();

  const handleExit = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav className="w-full bg-[#c54b4b] text-[#fffaf8] py-4 shadow-md">
      <div className="w-full flex justify-between items-center px-6">
        
        {/* Brand */}
        <h1 className="text-2xl font-serif tracking-wider">
          <span className="px-3 py-1 bg-[#fffaf8]/20 rounded-md">
            Blackfoot · <span className="text-[#ffd28c]">Play & Learn</span>
          </span>
        </h1>

        {/* Logout */}
        <button
          onClick={handleExit}
          className="px-4 py-1 border border-[#ffd28c] text-[#ffd28c] rounded 
                     hover:bg-[#ffd28c]/20 transition-all duration-200"
        >
          Logout
        </button>

      </div>
    </nav>
  );
}
