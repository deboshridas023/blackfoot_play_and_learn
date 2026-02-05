import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import TopActions, { BackButton, ExitButton } from "../components/ui/TopActions";
import Button from "../components/ui/Button";
import { storage, db, auth } from "../firebase";
import { ref, getDownloadURL } from "firebase/storage";
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { ChevronLeft, Home, RotateCcw, Volume2, Eraser, SkipForward } from "lucide-react";

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
  const selectedDialect = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("dialect") || null;
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
        await setDoc(
          userDocRef,
          {
            builderScore: points,
            createdAt: new Date(),
          },
          { merge: true }
        );
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
        // debug
        // eslint-disable-next-line no-console
        console.debug('[fillinthegap] loadThemeLevels start', { themeId, selectedDialect });

        // Firestore structure from your screenshot:
        // blackfoot builder/{themeId}/sentences/{sentenceId}
        const colRef = collection(db, "blackfoot builder", themeId, "sentences");
        // If a dialect is selected, prefer using the theme's top-level `dialect` field
        // (your theme documents include `dialect`), otherwise fall back to querying
        // sentences by dialect if they have that field.
        let snap;
        if (selectedDialect) {
          try {
            const themeDocRef = doc(db, "blackfoot builder", themeId);
            const themeSnap = await getDoc(themeDocRef);
            const themeData = themeSnap.exists() ? themeSnap.data() : null;
            // debug
            // eslint-disable-next-line no-console
            console.debug('[fillinthegap] themeData for', themeId, themeData);

            if (themeData && themeData.dialect && String(themeData.dialect).toLowerCase() === String(selectedDialect).toLowerCase()) {
              // Theme itself is for the selected dialect: load all sentences for this theme
              // debug
              // eslint-disable-next-line no-console
              console.debug('[fillinthegap] theme-level dialect matches; loading all sentences for theme', themeId);
              snap = await getDocs(colRef);
              // eslint-disable-next-line no-console
              console.debug('[fillinthegap] loaded sentences count (theme-level):', snap.size);
            } else {
              // Fallback: try to query sentences by dialect (in case your sentence docs include dialect)
              // debug
              // eslint-disable-next-line no-console
              console.debug('[fillinthegap] theme-level dialect not match; querying sentences by dialect', selectedDialect);
              const q = query(colRef, where("dialect", "==", selectedDialect));
              snap = await getDocs(q);
              // eslint-disable-next-line no-console
              console.debug('[fillinthegap] loaded sentences count (query-by-dialect):', snap.size);
            }
          } catch (err) {
            console.error("Error checking theme dialect:", err);
            snap = await getDocs(colRef);
          }
        } else {
          snap = await getDocs(colRef);
        }

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
  }, [themeId, selectedDialect]);

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
      <Page className="flex items-center" containerClassName="py-16" variant="paper">
        <Navbar />
        <div className="w-full max-w-xl mx-auto pt-10">
          <Card className="p-6 sm:p-8 text-center">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Blackfoot Builder
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-[var(--text)]">
              Session completed
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Final score: {score}</p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={restart} leftIcon={RotateCcw}>
                Restart
              </Button>
              <Button
                onClick={() => navigate("/games/fillinthegapthemes")}
                variant="secondary"
                leftIcon={ChevronLeft}
              >
                Back to Themes
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="secondary"
                leftIcon={Home}
              >
                Home
              </Button>
            </div>
          </Card>
        </div>
      </Page>
    );
  }

  if (!themeId) {
    return (
      <Page containerClassName="py-10" variant="paper">
        <Navbar />

        <header className="pt-10 pb-4">
          <div className="max-w-4xl">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Blackfoot Builder
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
              Choose a theme to begin
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Start from the Themes page to load a sentence set.
            </p>
          </div>

          <TopActions
            left={
              <BackButton
                onClick={() => navigate("/games/fillinthegapthemes")}
                icon={ChevronLeft}
              >
                Go to Themes
              </BackButton>
            }
            right={<ExitButton onClick={() => navigate("/")} icon={Home} />}
          />
        </header>
      </Page>
    );
  }

  if (levelsLoading) {
    return (
      <Page className="flex items-center" containerClassName="py-16" variant="paper">
        <div className="w-full max-w-xl mx-auto text-center text-[var(--muted)]">
          Loading builder sentences…
        </div>
      </Page>
    );
  }

  if (!current) {
    return (
      <Page containerClassName="py-10" variant="paper">
        <Navbar />
        <div className="pt-10">
          <Card className="p-6 text-center">
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text)]">
              No builder sentences found
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              This theme doesn’t have any sentences yet.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                onClick={() => navigate("/games/fillinthegapthemes")}
                variant="secondary"
                leftIcon={ChevronLeft}
              >
                Back to Themes
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="secondary"
                leftIcon={Home}
              >
                Home
              </Button>
            </div>
          </Card>
        </div>
      </Page>
    );
  }

  return (
    <Page variant="paper">
      <Navbar />

      <div className="pt-8">
        <header>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Blackfoot Builder
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
            Fill in the gap
          </h1>

          <TopActions
            left={
              <BackButton
                onClick={() => navigate("/games/fillinthegapthemes")}
                icon={ChevronLeft}
              >
                Back to Themes
              </BackButton>
            }
            right={<ExitButton onClick={() => navigate("/")} icon={Home} />}
          />
        </header>

        <div className="mt-8 pb-12 flex justify-center">
          <div className="w-full max-w-5xl">
            <Card className="p-6 sm:p-7 border border-rose-200/70">
              {/* Header: Score + Progress */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-[var(--muted)]">
                  Level <span className="font-medium text-[var(--text)]">{levelIndex + 1}</span> of{" "}
                  <span className="font-medium text-[var(--text)]">{levels.length}</span>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-sm text-[var(--text)]">
                  <span className="text-[var(--muted)]">Score</span>
                  <span className="font-semibold">{score}</span>
                </div>

                {selectedDialect && (
                  <div className="ml-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/70 px-2 py-0.5 text-sm text-[var(--text)]">
                    <span className="text-[var(--muted)] text-xs">Dialect</span>
                    <span className="font-semibold text-sm">{selectedDialect}</span>
                  </div>
                )}
              </div>

              {/* Audio */}
              <div className="mt-6 grid place-items-center gap-2">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Audio
                </div>
                <Button
                  onClick={playAudio}
                  disabled={audioBusy}
                  leftIcon={Volume2}
                >
                  {audioBusy ? "Loading…" : "Play"}
                </Button>
                <div className="text-xs text-[var(--muted)]">
                  {current.audio ? current.audio : "Speech synthesis"}
                </div>
              </div>

              {/* Sentences */}
              <div className="mt-8 grid gap-6">
                <div className="text-center">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Blackfoot
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-semibold text-[var(--text)]">
                    {current.blackfoot}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="text-center">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    English
                  </div>

                  <div
                    className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-[var(--text)]"
                    style={{ fontSize: "clamp(1rem, 2.1vw, 1.25rem)" }}
                  >
                    {templateParts.map((part, idx) => {
                      const isBlank = idx < blanksCount;

                      return (
                        <span key={idx} className="flex items-center gap-2">
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
                              className="w-24 sm:w-28 md:w-32 text-center rounded-md border border-[var(--border)] bg-white/80 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                              placeholder="type…"
                            />
                          )}
                        </span>
                      );
                    })}
                  </div>

                  {feedback && (
                    <div
                      className={
                        "mt-4 text-sm " +
                        (feedback.type === "success"
                          ? "text-emerald-700"
                          : "text-rose-700")
                      }
                    >
                      {feedback.msg}
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Button type="submit">Check answer</Button>
                    <Button
                      type="button"
                      onClick={() => setInputs((prev) => prev.map(() => ""))}
                      variant="secondary"
                      leftIcon={Eraser}
                    >
                      Clear
                    </Button>
                    <Button
                      type="button"
                      onClick={handleNext}
                      variant="secondary"
                      leftIcon={SkipForward}
                    >
                      Skip
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
