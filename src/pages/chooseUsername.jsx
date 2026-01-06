import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import {
  isUsernameAvailable,
  normalizeUsername,
  reserveUsernameForUser,
  validateUsername,
} from "../utils/username";
import { AtSign, CheckCircle2 } from "lucide-react";

export default function ChooseUsername() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [raw, setRaw] = useState("");
  const normalized = useMemo(() => normalizeUsername(raw), [raw]);
  const validation = useMemo(() => validateUsername(raw), [raw]);

  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null); // null | boolean
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // If already has username, skip this page
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.email) return;
      const snap = await getDoc(doc(db, "users", user.email));
      if (cancelled) return;
      if (snap.exists() && snap.data()?.username) {
        navigate("/", { replace: true });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [navigate, user?.email]);

  // Availability check with a small debounce
  useEffect(() => {
    let cancelled = false;
    if (!validation.ok) {
      setAvailable(null);
      return;
    }

    setChecking(true);
    setAvailable(null);
    setError("");
    setInfo("");

    const t = setTimeout(async () => {
      try {
        const ok = await isUsernameAvailable(db, validation.normalized);
        if (!cancelled) setAvailable(ok);
      } catch (e) {
        if (!cancelled) setAvailable(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [validation.ok, validation.normalized]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!user?.email) {
      setError("You must be signed in to set a username.");
      return;
    }

    if (!validation.ok) {
      setError(validation.message || "Invalid username.");
      return;
    }

    setBusy(true);
    try {
      await reserveUsernameForUser({
        db,
        email: user.email,
        uid: user.uid,
        username: raw,
      });
      setInfo("Username saved! Redirecting…");
      setTimeout(() => navigate("/", { replace: true }), 500);
    } catch (err) {
      setError(err?.message || "Failed to save username.");
    } finally {
      setBusy(false);
    }
  };

  const statusText = useMemo(() => {
    if (!raw.trim()) return "";
    if (!validation.ok) return validation.message;
    if (checking) return "Checking availability…";
    if (available === false) return "That username is taken.";
    if (available === true) return "Username available.";
    return "";
  }, [available, checking, raw, validation.message, validation.ok]);

  const canSubmit =
    !!user?.email && validation.ok && available === true && !busy && !checking;

  return (
    <Page containerClassName="py-10" className="flex items-center" variant="paper">
      <div className="w-full max-w-xl mx-auto">
        <Card className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/70 ring-1 ring-amber-300/40">
              <AtSign className="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text)]">
                Choose a username
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                This will be shown on the leaderboard. It must be unique.
              </p>
            </div>
          </div>

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

          <form className="mt-6" onSubmit={handleSave}>
            <label className="block text-xs font-medium text-[var(--muted)]">
              Username
            </label>
            <input
              type="text"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="e.g. firstname_lastname"
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white/80 px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />

            <div className="mt-2 text-xs text-[var(--muted)]">
              Your username will be saved as: <span className="font-medium">{normalized || "—"}</span>
            </div>

            {statusText && (
              <div
                className={
                  "mt-2 text-sm " +
                  (!validation.ok || available === false
                    ? "text-rose-700"
                    : available === true
                      ? "text-emerald-700"
                      : "text-[var(--muted)]")
                }
              >
                {statusText}
              </div>
            )}

            <div className="mt-6 grid gap-3">
              <Button type="submit" disabled={!canSubmit} leftIcon={CheckCircle2}>
                {busy ? "Saving…" : "Save username"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}

