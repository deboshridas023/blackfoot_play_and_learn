import { useState } from "react";
import { auth, googleProvider } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { LogIn, UserPlus } from "lucide-react";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleEmailAuth = async () => {
    setError("");
    setInfo("");
    if (isSignup) {
      if (password !== confirm) {
        setError("Passwords do not match");
        return;
      }
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Send verification email and require verification before app access.
        await sendEmailVerification(cred.user);
        // Keep them signed in so the app can show the Verify Email gate immediately.
        setInfo("Account created. Please check your email and verify your address to continue.");
      } catch (err) {
        setError(err.message);
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleMode = () => {
    setError("");
    setInfo("");
    setIsSignup(!isSignup);
  };

  return (
    <Page containerClassName="py-10" className="flex items-center" variant="paper">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <Card className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Blackfoot · Play & Learn
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
                {isSignup ? "Create your account" : "Sign in"}
              </h1>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {isSignup
                  ? "Create an account to track your progress and scores."
                  : "Welcome back — continue your learning."}
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

          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleEmailAuth();
            }}
          >
            <div className="grid gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)]">Email</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white/80 px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted)]">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white/80 px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {isSignup && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)]">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white/80 px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3">
              <Button
                type="submit"
                leftIcon={isSignup ? UserPlus : LogIn}
                className="w-full"
              >
                {isSignup ? "Create account" : "Sign in"}
              </Button>

              <Button
                type="button"
                onClick={handleGoogle}
                variant="secondary"
                className="w-full"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt=""
                  className="w-5 h-5"
                />
                Continue with Google
              </Button>
            </div>
          </form>

          <p className="text-sm text-center mt-5 text-[var(--muted)]">
            {isSignup ? "Already have an account?" : "Don’t have an account?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-[var(--brand)] font-medium hover:underline"
            >
              {isSignup ? "Sign in" : "Create one"}
            </button>
          </p>
        </Card>

        <Card className="p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Learning note
            </div>
            <p className="mt-3 text-xl sm:text-2xl font-semibold text-[var(--text)] leading-snug">
              “Reviving a language is preserving a world of knowledge.”
            </p>
            <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
              Keep your sessions short, consistent, and repeat what you learn.
              Your scores update as you play.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-[var(--border)] bg-white/60 px-4 py-3 text-sm text-[var(--muted)]">
            Tip: Try Flashcards first, then Quiz for quick reinforcement.
          </div>
        </Card>
      </div>
    </Page>
  );
}
