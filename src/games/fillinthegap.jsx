import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import { storage, db, auth } from "../firebase";
import { ref, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

const LEVELS = [
  {
    id: 1,
    blackfoot: "Oki niisto (ni)taakitaakihkiit napayin(i)",
    englishTemplate: "Well, I will often __ bannock.",
    answer: "bake",
    // Optional: if you add an audio file to Firebase Storage: blackfootaudios/<filename>
    audio: null,
  },
  {
    id: 2,
    blackfoot: "Naatoyiiksi",
    englishTemplate: "I will __ tea.",
    answer: "make",
    audio: null,
  },
  {
    id: 3,
    blackfoot: "Aksistsi pookaiyi",
    englishTemplate: "They often __ songs.",
    answer: "sing",
    audio: null,
  },
];

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, ""); // remove punctuation/spaces, Unicode-safe
}

export default function FillInTheGap() {
  const navigate = useNavigate();
  const [levelIndex, setLevelIndex] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); // {type:'success'|'error', msg:string}
  const [completed, setCompleted] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const audioRef = useRef(null);

  // Persist Blackfoot Builder (Fill in the Gap) score to Firestore on completion
  async function addBuilderPointsForUser(points) {
    try {
      if (!points || points <= 0) return;

      const user = auth.currentUser;
      if (!user || !user.email) return;

      const email = user.email; // use email as document ID
      const userDocRef = doc(db, "users", email);
      const snap = await getDoc(userDocRef);

      if (!snap.exists()) {
        await setDoc(userDocRef, {
          builderScore: points,
          createdAt: new Date(),
        });
      } else {
        await updateDoc(userDocRef, {
          builderScore: increment(points),
        });
      }
    } catch (err) {
      console.error("Error updating builder score:", err);
    }
  }

  // When the game is completed, write the earned points once
  useEffect(() => {
    if (completed) {
      addBuilderPointsForUser(score);
    }
  }, [completed, score]);

  // Restore session state (persists until tab/window close)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("fillGapState");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.levelIndex === "number") setLevelIndex(saved.levelIndex);
      if (typeof saved.score === "number") setScore(saved.score);
    } catch {
      // ignore restore errors
    }
  }, []);

  // Persist on changes
  useEffect(() => {
    sessionStorage.setItem(
      "fillGapState",
      JSON.stringify({ levelIndex, score })
    );
  }, [levelIndex, score]);

  // Stop any playing audio when the level changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [levelIndex]);

  const current = LEVELS[levelIndex];
  const [leftText, rightText] = current.englishTemplate.split("__");

  async function playAudio() {
    try {
      setAudioBusy(true);
      if (current.audio) {
        // Use Firebase Storage audio similar to Flashcards
        const audioRefPath = ref(storage, `blackfootaudios/${current.audio}`);
        const url = await getDownloadURL(audioRefPath);
        if (!audioRef.current) audioRef.current = new Audio(url);
        else audioRef.current.src = url;
        await audioRef.current.play();
      } else {
        // Fallback: simple speech synthesis (may not support Blackfoot, but works as placeholder)
        if (window.speechSynthesis) {
          const uttr = new SpeechSynthesisUtterance(current.blackfoot);
          // Using en-US as a fallback voice; replace if a Blackfoot-capable voice is available
          uttr.lang = "en-US";
          window.speechSynthesis.speak(uttr);
        }
      }
    } catch (err) {
      console.error("Audio playback error:", err);
    } finally {
      setAudioBusy(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const isCorrect = normalize(input) === normalize(current.answer);
    if (isCorrect) {
      setScore((s) => s + 1);
      setFeedback({ type: "success", msg: "Correct! +1 point" });

      setTimeout(() => {
        if (levelIndex + 1 < LEVELS.length) {
          setLevelIndex((i) => i + 1);
          setInput("");
          setFeedback(null);
        } else {
          setCompleted(true);
        }
      }, 600);
    } else {
      setFeedback({ type: "error", msg: "Try again." });
    }
  }

  function handleNext() {
    if (levelIndex + 1 < LEVELS.length) {
      setLevelIndex((i) => i + 1);
      setInput("");
      setFeedback(null);
    } else {
      setCompleted(true);
    }
  }

  function restart() {
    setLevelIndex(0);
    setScore(0);
    setInput("");
    setFeedback(null);
    setCompleted(false);
    sessionStorage.removeItem("fillGapState");
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-[#f8f1ec] text-[#6b2020] flex flex-col items-center justify-center space-y-6">
        <h2 className="text-3xl font-serif tracking-wide">
          You completed Fill in the Gap!
        </h2>
        <div className="text-lg">Final Score: {score}</div>
        <div className="flex gap-6">
          <button
            onClick={restart}
            className="px-5 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f]"
          >
            Restart
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 border border-[#d4af37] text-[#6b2020] rounded hover:bg-[#d4af37]/20"
          >
            Exit to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col text-[#6b2020]"
      style={{
        background:
          "linear-gradient(rgba(247, 230, 228, 0.95), rgba(240, 220, 216, 0.98)), url('https://www.transparenttextures.com/patterns/aged-paper.png')",
        backgroundRepeat: "repeat",
      }}
    >
      <Navbar />

      {/* Exit button (page-specific, consistent with Flashcards) */}
      <div className="flex justify-end px-6 mt-4">
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-[#c54b4b] text-[#fffaf8] rounded hover:bg-[#a63e3e] transition-all duration-200"
        >
          Exit Game & Return Home
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="relative w-[340px] h-[500px] sm:w-[420px] sm:h-[520px]">
          <div className="absolute w-full h-full bg-[#fff2f2] rounded-2xl shadow-[0_8px_24px_rgba(197,75,75,0.3)] p-6 border border-[#e3a4a4] flex flex-col justify-between">
            {/* Header: Score */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif tracking-wide text-[#a12222]">
                Fill in the Gap
              </h2>
              <div className="text-sm bg-[#d4af37]/20 text-[#6b2020] px-3 py-1 rounded border border-[#d4af37]">
                Score: {score}
              </div>
            </div>

            {/* Blackfoot sentence */}
            <div className="text-center mt-2">
              <div className="text-2xl font-serif text-[#a12222]">
                {current.blackfoot}
              </div>
              <div className="mt-3 flex flex-col items-center justify-center text-[#6b2020]">
                <div className="text-lg mb-2">
                  🎧 {current.audio ? current.audio : "Speech"}
                </div>
                <button
                  onClick={playAudio}
                  disabled={audioBusy}
                  className="px-4 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f] transition disabled:opacity-50"
                >
                  {audioBusy ? "Loading..." : "▶ Play Audio"}
                </button>
              </div>
            </div>

            {/* English sentence with blank */}
            <form onSubmit={handleSubmit} className="mt-6">
              <div className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-serif text-[#6b2020]">
                <span>{leftText}</span>
                <input
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-28 sm:w-36 text-center bg-transparent border-b-2 border-[#a12222] focus:outline-none focus:border-[#c54b4b] placeholder-[#a12222]/50"
                  placeholder="type..."
                />
                <span>{rightText}</span>
              </div>

              {/* Feedback */}
              {feedback && (
                <div
                  className={`mt-4 text-center text-sm ${
                    feedback.type === "success"
                      ? "text-green-700"
                      : "text-[#a12222]"
                  }`}
                >
                  {feedback.msg}
                </div>
              )}

              {/* Controls */}
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f] transition"
                >
                  Check Answer
                </button>
                <button
                  type="button"
                  onClick={() => setInput("")}
                  className="px-4 py-2 border border-[#d4af37] text-[#6b2020] rounded hover:bg-[#d4af37]/20 transition"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2 border border-[#d4af37] text-[#6b2020] rounded hover:bg-[#d4af37]/20 transition"
                >
                  Skip
                </button>
              </div>
            </form>

            {/* Progress indicator */}
            <div className="mt-4 text-center text-sm text-[#6b2020]/70">
               {levelIndex + 1} of {LEVELS.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
