import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import { storage, db, auth } from "../firebase";
import { ref, getDownloadURL } from "firebase/storage";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, ""); // remove punctuation/spaces, Unicode-safe
}

function parseAnswers(raw) {
  // Firestore multi-blank format: answer: "ans1, ans2" (comma-separated)
  if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean);

  if (raw && typeof raw === "object") {
    // tolerate map/object just in case (ans1/ans2)
    return Object.keys(raw)
      .sort()
      .map((k) => String(raw[k]).trim())
      .filter(Boolean);
  }

  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function FillInTheGap() {
  const navigate = useNavigate();
  const location = useLocation();

  const [levels, setLevels] = useState([]);
  const [levelsLoading, setLevelsLoading] = useState(false);

  const themeId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("themeId");
  }, [location.search]);
  const [levelIndex, setLevelIndex] = useState(0);
  const [inputs, setInputs] = useState([""]); // one input per blank
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); // {type:'success'|'error', msg:string}
  const [completed, setCompleted] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const audioRef = useRef(null);

  // Session storage is scoped per themeId.
  const sessionKey = useMemo(
    () => `fillGapState:${themeId || "default"}`,
    [themeId]
  );

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
      const raw = sessionStorage.getItem(sessionKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.levelIndex === "number") setLevelIndex(saved.levelIndex);
      if (typeof saved.score === "number") setScore(saved.score);
    } catch {
      // ignore restore errors
    }
  }, [sessionKey]);

  // Persist on changes
  useEffect(() => {
    sessionStorage.setItem(
      sessionKey,
      JSON.stringify({ levelIndex, score })
    );
  }, [levelIndex, score, sessionKey]);

  // Reset transient UI state when switching themes
  useEffect(() => {
    setInputs([""]);
    setFeedback(null);
    setCompleted(false);
    setLevelIndex(0);
    // score reset happens if they restart; keep score per theme session via session storage.
  }, [themeId]);

  // Load Firestore sentences for selected theme
  useEffect(() => {
    let cancelled = false;

    async function loadThemeLevels() {
      if (!themeId) {
        setLevels([]);
        return;
      }

      try {
        setLevelsLoading(true);

        // Firestore structure from your screenshot:
        // blackfoot builder/{themeId}/sentences/{sentenceId}
        const colRef = collection(db, "blackfoot builder", themeId, "sentences");
        const snap = await getDocs(colRef);

        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const an = Number(a.id);
            const bn = Number(b.id);
            if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
            return String(a.id).localeCompare(String(b.id));
          })
          .map((s, idx) => ({
            id: idx + 1,
            blackfoot: s.blackfoot ?? "",
            englishTemplate: s.english ?? "__",
            // Firestore format: answer is a comma-separated string for multi-blank sentences
            answers: parseAnswers(s.answer),
            audio: s.audio ?? null,
          }))
          .filter((lvl) => lvl.englishTemplate && lvl.answers?.length);

        if (!cancelled) {
          setLevels(data);
          setLevelIndex(0);
          setInputs([""]);
          setFeedback(null);
          setCompleted(false);
        }
      } catch (err) {
        console.error("Firestore error (blackfoot builder sentences):", err);
        if (!cancelled) setLevels([]);
      } finally {
        if (!cancelled) setLevelsLoading(false);
      }
    }

    loadThemeLevels();
    return () => {
      cancelled = true;
    };
  }, [themeId]);

  // Stop any playing audio when the level changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [levelIndex]);

  const current = levels[levelIndex] || levels[0];
  const templateParts = (current?.englishTemplate || "__").split("__");
  const blanksCount = Math.max(0, templateParts.length - 1);

  const expectedAnswers = useMemo(() => {
    // Local levels use `answer` (string), Firestore levels use `answers` (string[])
    if (Array.isArray(current?.answers) && current.answers.length) return current.answers;
    if (typeof current?.answer === "string" && current.answer.trim()) return [current.answer.trim()];
    return [];
  }, [current]);

  // Ensure inputs array matches the number of blanks
  useEffect(() => {
    setInputs((prev) => {
      const next = [...prev];
      while (next.length < blanksCount) next.push("");
      return next.slice(0, Math.max(1, blanksCount));
    });
  }, [blanksCount]);

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

    const answersToCheck = expectedAnswers;
    if (!answersToCheck.length) {
      setFeedback({ type: "error", msg: "No answer configured." });
      return;
    }

    // If template has multiple blanks but only 1 answer, we treat it as single-blank.
    // If template has N blanks and answers has N items, we check each position.
    const required = blanksCount > 0 ? blanksCount : 1;
    const normalizedInputs = inputs.slice(0, required).map(normalize);
    const normalizedAnswers = answersToCheck.slice(0, required).map(normalize);

    const isCorrect = normalizedInputs.every(
      (val, i) => val && val === normalizedAnswers[i]
    );

    if (isCorrect) {
      setScore((s) => s + 1);
      setFeedback({ type: "success", msg: "Correct! +1 point" });

      setTimeout(() => {
        if (levelIndex + 1 < levels.length) {
          setLevelIndex((i) => i + 1);
          setInputs([""]);
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
    if (levelIndex + 1 < levels.length) {
      setLevelIndex((i) => i + 1);
      setInputs([""]);
      setFeedback(null);
    } else {
      setCompleted(true);
    }
  }

  function restart() {
    setLevelIndex(0);
    setScore(0);
    setInputs([""]);
    setFeedback(null);
    setCompleted(false);
    sessionStorage.removeItem(sessionKey);
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
            onClick={() => navigate("/games/fillinthegapthemes")}
            className="px-5 py-2 border border-[#d4af37] text-[#6b2020] rounded hover:bg-[#d4af37]/20"
          >
            Back to Themes
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

  if (!themeId) {
    return (
      <div className="min-h-screen bg-[#f8f1ec] text-[#6b2020]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-serif mb-4">Fill in the Gap</h1>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <button
              onClick={() => navigate("/games/fillinthegapthemes")}
              className="px-4 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f] transition-all duration-200"
            >
              Go to Themes
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 border border-[#d4af37] text-[#6b2020] rounded hover:bg-[#d4af37]/20 transition"
            >
              Exit to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (levelsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f1ec] text-[#6b2020]">
        <p>Loading builder sentences...</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-screen bg-[#f8f1ec] text-[#6b2020]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-serif mb-4">Fill in the Gap</h1>
          <p className="text-[#6b2020]/80">
            No builder sentences found for this theme.
          </p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <button
              onClick={() => navigate("/games/fillinthegapthemes")}
              className="px-4 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f] transition-all duration-200"
            >
              Back to Themes
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 border border-[#d4af37] text-[#6b2020] rounded hover:bg-[#d4af37]/20 transition"
            >
              Exit to Home
            </button>
          </div>
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

      {/* ⭐ Unified Button Bar — consistent with Flashcards / Short Stories */}
      <div className="flex justify-between px-6 mt-4">
        <button
          onClick={() => navigate("/games/fillinthegapthemes")}
          className="px-4 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f] transition-all duration-200"
        >
          ← Back to Themes
        </button>

        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f] transition-all duration-200"
        >
          Exit Game & Return Home
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="relative w-[98vw] max-w-[1280px] h-[520px] sm:h-[540px]">
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
            <div>
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
            {/* Blackfoot sentence */}
            <div className="text-center mt-2">
              <div className="text-xs uppercase tracking-wider text-[#6b2020]/70 mb-2">
                Blackfoot
              </div>
              <div className="text-2xl font-serif text-[#a12222]">
                {current.blackfoot}
              </div>
            </div>

            {/* English sentence with blank */}
            <form onSubmit={handleSubmit} className="mt-6">
              <div className="text-center mb-2">
                <span className="text-xs uppercase tracking-wider text-[#6b2020]/70">
                  English
                </span>
              </div>
              <div
                className="flex items-center justify-center gap-1 font-serif text-[#6b2020] whitespace-nowrap max-w-full overflow-x-hidden"
                style={{ fontSize: "clamp(1rem, 2.1vw, 1.5rem)" }}
              >
                {templateParts.map((part, idx) => {
                  const isBlank = idx < blanksCount;

                  return (
                    <span key={idx} className="flex items-center gap-2 shrink-0">
                      <span>{part}</span>
                      {isBlank && (
                        <input
                          autoFocus={idx === 0}
                          value={inputs[idx] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setInputs((prev) => {
                              const next = [...prev];
                              next[idx] = val;
                              return next;
                            });
                          }}
                          className="w-24 sm:w-28 md:w-32 text-center bg-transparent border-b-2 border-[#a12222] focus:outline-none focus:border-[#c54b4b] placeholder-[#a12222]/50 shrink-0"
                          placeholder="type..."
                        />
                      )}
                    </span>
                  );
                })}
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
                  onClick={() => setInputs((prev) => prev.map(() => ""))}
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
              {levelIndex + 1} of {levels.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
