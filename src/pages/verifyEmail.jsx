import { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase";
import { sendEmailVerification, signOut } from "firebase/auth";

export default function VerifyEmail() {
  const [user, setUser] = useState(() => auth.currentUser);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  const canVerify = useMemo(() => {
    // Only enforce for password-based accounts; Google already has verified emails.
    return !!user && user.providerData?.some((p) => p.providerId === "password");
  }, [user]);

  const handleResend = async () => {
    setError("");
    setInfo("");
    if (!user) return;
    setBusy(true);
    try {
      await sendEmailVerification(user);
      setInfo("Verification email sent. Check your inbox (and spam folder). ");
    } catch (e) {
      setError(e?.message || "Failed to send verification email.");
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async () => {
    setError("");
    setInfo("");
    if (!user) return;
    setBusy(true);
    try {
      // Reload user from Firebase to pick up emailVerified change.
      await user.reload();
      setUser(auth.currentUser);
      if (auth.currentUser?.emailVerified) {
        setInfo("Email verified! Redirecting you into the app...");
        // `emailVerified` changes do not reliably trigger auth listeners;
        // reload the page so the app re-evaluates auth state.
        setTimeout(() => window.location.reload(), 500);
      } else {
        setInfo("Not verified yet. If you just verified, wait a few seconds then refresh again.");
      }
    } catch (e) {
      setError(e?.message || "Failed to refresh verification status.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#fffaf8] text-[#6b2020] p-8">
        <div className="bg-[#fff5f5] border border-[#e3a4a4] rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-serif text-[#c54b4b] mb-2">Verify your email</h1>
          <p className="text-sm">Please log in to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fffaf8] text-[#6b2020] p-8">
      <div className="bg-[#fff5f5] border border-[#e3a4a4] shadow-[0_8px_24px_rgba(197,75,75,0.2)] rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-serif text-[#c54b4b] text-center mb-2">Verify your email</h1>

        <p className="text-sm text-center mb-4">
          We sent a verification link to <span className="font-medium">{user.email}</span>. Please verify to
          continue.
        </p>

        {!canVerify && (
          <p className="text-sm text-center mb-4">
            This account doesn’t require email verification (provider login).
          </p>
        )}

        {error && <p className="text-[#c54b4b] text-sm mb-3 text-center">{error}</p>}
        {info && <p className="text-[#6b2020] text-sm mb-3 text-center">{info}</p>}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleResend}
            disabled={busy || !canVerify}
            className="w-full bg-[#c54b4b] disabled:opacity-60 hover:bg-[#a33e3e] text-[#fffaf8] py-2 rounded shadow-sm transition-all duration-200"
          >
            Resend verification email
          </button>

          <button
            onClick={handleRefresh}
            disabled={busy}
            className="w-full border border-[#c54b4b] text-[#c54b4b] py-2 rounded hover:bg-[#c54b4b]/10 transition-all duration-200"
          >
            I’ve verified — refresh
          </button>

          <button
            onClick={handleLogout}
            disabled={busy}
            className="w-full text-sm underline text-center text-[#6b2020] hover:text-[#a33e3e]"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
