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
      bg-[#fffaf8] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] text-[#6b2020]"
    >
      {/* LEFT — Login/Signup Card */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="bg-[#fff5f5] border border-[#e3a4a4] shadow-[0_8px_24px_rgba(197,75,75,0.2)] 
                        px-8 py-10 w-[700px] max-w-md rounded-2xl">
          <h1 className="text-2xl font-serif text-[#c54b4b] text-center mb-4 tracking-wide">
            Blackfoot · Play & Learn
          </h1>

          {error && <p className="text-[#c54b4b] text-sm mb-3 text-center">{error}</p>}

          <input
            type="email"
            placeholder="Email"
            className="w-full mb-3 px-3 py-2 border border-[#e3a4a4] rounded bg-white text-[#6b2020]
                       focus:outline-none focus:ring-1 focus:ring-[#c54b4b]"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full mb-3 px-3 py-2 border border-[#e3a4a4] rounded bg-white text-[#6b2020]
                       focus:outline-none focus:ring-1 focus:ring-[#c54b4b]"
            onChange={(e) => setPassword(e.target.value)}
          />

          {isSignup && (
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full mb-3 px-3 py-2 border border-[#e3a4a4] rounded bg-white text-[#6b2020]
                         focus:outline-none focus:ring-1 focus:ring-[#c54b4b]"
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}

          <button
            onClick={handleEmailAuth}
            className="w-full bg-[#c54b4b] hover:bg-[#a33e3e] text-[#fffaf8] py-2 rounded mb-4 
                       shadow-sm transition-all duration-200"
          >
            {isSignup ? "Create Account" : "Login"}
          </button>

          <button
            onClick={handleGoogle}
            className="w-full flex justify-center items-center gap-2 border border-[#c54b4b] 
                       text-[#c54b4b] py-2 rounded hover:bg-[#c54b4b]/10 transition-all duration-200"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>

          <p className="text-sm text-center mt-4 text-[#6b2020]">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <span
              onClick={() => setIsSignup(!isSignup)}
              className="text-[#c54b4b] font-medium underline cursor-pointer hover:text-[#a33e3e]"
            >
              {isSignup ? "Login" : "Sign up"}
            </span>
          </p>
        </div>
      </div>

      {/* RIGHT — Quote */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-[#fffaf8]/70">
        <p className="text-[#d4af37] text-3xl font-serif text-center italic max-w-md leading-relaxed">
          “Reviving a language is preserving a world of knowledge.”
        </p>
      </div>
    </div>
  );
}
