import { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase";
import { sendEmailVerification, signOut } from "firebase/auth";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { MailCheck, RefreshCw, LogOut } from "lucide-react";

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
      <Page containerClassName="py-10" className="flex items-center" variant="paper">
        <div className="w-full max-w-xl mx-auto">
          <Card className="p-6 sm:p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white/70 ring-1 ring-amber-300/40">
              <MailCheck className="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-xl sm:text-2xl font-semibold text-[var(--text)]">
              Verify your email
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Please sign in to continue.
            </p>
          </Card>
        </div>
      </Page>
    );
  }

  return (
    <Page containerClassName="py-10" className="flex items-center" variant="paper">
      <div className="w-full max-w-xl mx-auto">
        <Card className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/70 ring-1 ring-amber-300/40">
              <MailCheck className="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text)]">
                Verify your email
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                We sent a verification link to{" "}
                <span className="font-medium text-[var(--text)]">{user.email}</span>.
              </p>
            </div>
          </div>

          {!canVerify && (
            <div className="mt-4 rounded-lg border border-amber-300/60 bg-amber-50/60 px-3 py-2 text-sm text-[var(--text)]">
              This account doesn’t require email verification (provider login).
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50/70 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          {info && (
            <div className="mt-4 rounded-lg border border-amber-300/60 bg-amber-50/60 px-3 py-2 text-sm text-[var(--text)]">
              {info}
            </div>
          )}

          <div className="mt-6 grid gap-3">
            <Button
              onClick={handleResend}
              disabled={busy || !canVerify}
              leftIcon={MailCheck}
              className="w-full"
            >
              Resend verification email
            </Button>

            <Button
              onClick={handleRefresh}
              disabled={busy}
              variant="secondary"
              leftIcon={RefreshCw}
              className="w-full"
            >
              I’ve verified — refresh
            </Button>

            <Button
              onClick={handleLogout}
              disabled={busy}
              variant="ghost"
              leftIcon={LogOut}
              className="w-full justify-center"
            >
              Log out
            </Button>
          </div>
        </Card>
      </div>
    </Page>
  );
}
