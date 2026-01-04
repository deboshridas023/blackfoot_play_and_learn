import { signOut } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  const accountEmail = useMemo(() => {
    // Prefer a real email, but fall back to a friendly label for providers/accounts
    // that may not have one.
    if (!user) return "";
    return user.email || user.providerData?.find((p) => p.email)?.email || "Signed in";
  }, [user]);

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

        {/* Account + Logout */}
        <div className="flex items-center gap-4">
          <div className="text-right leading-tight max-w-[320px]">
            <div className="text-[11px] uppercase tracking-wider text-[#fffaf8]/80">
              Account
            </div>
            <div
              className="text-sm font-medium truncate"
              title={accountEmail}
            >
              {accountEmail}
            </div>
          </div>

          <button
            onClick={handleExit}
            className="px-4 py-1 border border-[#ffd28c] text-[#ffd28c] rounded 
                       hover:bg-[#ffd28c]/20 transition-all duration-200"
          >
            Logout
          </button>
        </div>

      </div>
    </nav>
  );
}
