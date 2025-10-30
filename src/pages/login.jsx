import { useState } from "react";
import { auth, googleProvider } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleEmailAuth = async () => {
    setError("");
    if (isSignup) {
      if (password !== confirm) {
        setError("Passwords do not match");
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, email, password);
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

  return (
    <div
      className="min-h-screen w-full flex flex-col md:flex-row
      bg-[#2c241f] bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"
    >
      {/* LEFT — Login Card */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="bg-[#f4ead5]/95 px-8 py-10 w-[700px] h-[400px] rounded shadow-lg border border-[#d6c8aa] flex flex-col justify-center">
          <h1 className="text-2xl font-serif text-[#6b4e3d] text-center mb-2">
            Blackfoot · Play & Learn
          </h1>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <input
            type="email"
            placeholder="Email"
            className="w-full mb-3 px-3 py-2 border rounded bg-white"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full mb-3 px-3 py-2 border rounded bg-white"
            onChange={(e) => setPassword(e.target.value)}
          />

          {isSignup && (
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full mb-3 px-3 py-2 border rounded bg-white"
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}

          <button
            onClick={handleEmailAuth}
            className="w-full bg-[#6b4e3d] hover:bg-[#523d30] text-white py-2 rounded mb-4 transition"
          >
            {isSignup ? "Create Account" : "Login"}
          </button>

          <button
            onClick={handleGoogle}
            className="w-full flex justify-center items-center gap-2 border border-[#6b4e3d] text-[#6b4e3d] py-2 rounded hover:bg-[#6b4e3d]/10 transition"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt=""
              className="w-5 h-5"
            />
            Continue with Google
          </button>

          <p className="text-sm text-center mt-4 text-[#6b4e3d]">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <span
              onClick={() => setIsSignup(!isSignup)}
              className="underline cursor-pointer"
            >
              {isSignup ? "Login" : "Sign up"}
            </span>
          </p>
        </div>
      </div>

      {/* RIGHT — Quote */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <p className="text-[#d4af37] text-3xl font-serif text-center italic max-w-md">
          “Reviving a language is preserving a world of knowledge.”
        </p>
      </div>
    </div>
  );
}
