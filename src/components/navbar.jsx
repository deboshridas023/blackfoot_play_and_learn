import { signOut } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { GraduationCap, LogOut, UserRound } from "lucide-react";
import Button from "./ui/Button";

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
    <nav className="w-full bg-[var(--brand-2)] text-white/95 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-wrap gap-3 justify-between items-center">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <div className="text-xs uppercase tracking-[0.18em] text-white/70">
              Blackfoot
            </div>
            <div className="text-lg sm:text-xl font-semibold tracking-tight">
              Play & Learn
            </div>
          </div>
        </div>

        {/* Account + Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 text-right leading-tight max-w-[320px]">
            <UserRound className="h-4 w-4 text-white/70" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-white/70">
                Account
              </div>
              <div className="text-sm font-medium truncate" title={accountEmail}>
                {accountEmail}
              </div>
            </div>
          </div>

          <Button
            onClick={handleExit}
            variant="secondary"
            size="sm"
            leftIcon={LogOut}
            className="bg-white/10 text-white border-white/20 hover:bg-white/15"
          >
            Logout
          </Button>
        </div>

      </div>
    </nav>
  );
}
