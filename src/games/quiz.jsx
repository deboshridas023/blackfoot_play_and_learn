import React, { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/navbar";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import TopActions, { ExitButton } from "../components/ui/TopActions";
import Button from "../components/ui/Button";
import { db, auth } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Home, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, Trophy } from "lucide-react";

const QUIZ_SIZE = 10;

function normalize(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase();
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function coerceAnswerIndex(correctAnswer, options) {
  // Accept:
  // - 1..4 (number)
  // - "1".."4"
  // - "Option-1".."Option-4"
  // - exact option label (string)
  const raw = String(correctAnswer ?? "").trim();
  if (!raw) return -1;

  // numeric 1..4
  const asNum = Number(raw);
  if (Number.isFinite(asNum) && asNum >= 1 && asNum <= 4) return asNum - 1;

  // Option-1..Option-4
  const m = raw.match(/^option\s*[-_]?\s*(\d)$/i);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 4) return n - 1;
  }

  // Match label
  const idx = options.findIndex((o) => normalize(o) === normalize(raw));
  return idx;
}

function mapFirestoreQuizDoc(docSnap) {
  const data = docSnap.data() || {};
  const prompt = data["Question"] ?? "";
  const options = [
    data["Option-1"],
    data["Option-2"],
    data["Option-3"],
    data["Option-4"],
  ].map((x) => String(x ?? ""));

  const correctAnswer = data["CorrectAnswer"] ?? "";
  const answerIndex = coerceAnswerIndex(correctAnswer, options);

  return {
    id: docSnap.id,
    prompt,
    options,
    correctAnswer,
    answerIndex,
  };
}

export default function Quiz() {
  const navigate = useNavigate();
  const [questionBank, setQuestionBank] = useState([]); // all questions from Firestore
  const [questions, setQuestions] = useState([]); // 10 random questions per attempt
  const total = questions.length;

  const [step, setStep] = useState(0); // 0..(total-1)
  const [answers, setAnswers] = useState([]); // store option index
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Persist quiz score to Firestore (1 point per correct answer)
  async function addQuizPointsForUser(points) {
    try {
      // no-op for 0 or negative; also skip if not logged in
      if (!points || points <= 0) return;

      const user = auth.currentUser;
      if (!user || !user.email) return;

      const email = user.email; // use email as document ID
      const userDocRef = doc(db, "users", email);
      const snap = await getDoc(userDocRef);

      if (!snap.exists()) {
        await setDoc(userDocRef, {
          quizScore: points,
          createdAt: new Date(),
        });
      } else {
        await updateDoc(userDocRef, {
          quizScore: increment(points),
        });
      }
    } catch (err) {
      console.error("Error updating quiz score:", err);
    }
  }

  const chooseRandomQuestions = useCallback(
    (bank) => {
      const picked = shuffle(bank).slice(0, Math.min(QUIZ_SIZE, bank.length));
      setQuestions(picked);
      setAnswers(Array(picked.length).fill(null));
      setStep(0);
      setSubmitted(false);
    },
    [setQuestions]
  );

  // Load quiz questions from Firestore, then pick 10 random for this session
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const snap = await getDocs(collection(db, "quiz"));
        const bank = snap.docs.map(mapFirestoreQuizDoc).filter((q) => q.prompt);

        if (cancelled) return;
        setQuestionBank(bank);
        chooseRandomQuestions(bank);
      } catch (err) {
        console.error("Firestore error (quiz):", err);
        if (!cancelled) setError("Failed to load quiz questions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [chooseRandomQuestions]);

  const current = questions[step];
  const currentAnswer = answers?.[step];

  function isCorrect(i) {
    const q = questions[i];
    const selectedIdx = answers[i];
    if (!q || selectedIdx == null) return false;

    if (typeof q.answerIndex === "number" && q.answerIndex >= 0) {
      return selectedIdx === q.answerIndex;
    }

    // fallback: compare text
    const selectedLabel = q.options?.[selectedIdx] ?? "";
    return normalize(selectedLabel) === normalize(q.correctAnswer);
  }

  const score = useMemo(() => {
    if (!questions.length || !answers.length) return 0;
    return answers.reduce((acc, _ans, i) => acc + (isCorrect(i) ? 1 : 0), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, questions]);

  function selectOption(index) {
    if (submitted) return;
    setAnswers((prev) => {
      const next = prev.slice();
      next[step] = index;
      return next;
    });
  }

  function prevStep() {
    setStep((s) => Math.max(0, s - 1));
  }

  function nextStep() {
    if (step < total - 1) setStep((s) => s + 1);
  }

  async function submit() {
    // Only award points when user has attempted all questions.
    // Also guard against double-clicks.
    if (submitted || submitting) return;
    if (!total) return;
    if (!answers.every((a) => a !== null && a !== undefined)) return;

    try {
      setSubmitting(true);
      await addQuizPointsForUser(score);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    // Retake uses a new random set from the same loaded bank
    if (questionBank.length) {
      chooseRandomQuestions(questionBank);
    } else {
      setAnswers(Array(total).fill(null));
      setSubmitted(false);
      setStep(0);
    }
    setSubmitting(false);
  }

  const progressPct = total ? Math.round(((step + 1) / total) * 100) : 0;

  return (
    <Page variant="paper">
      <Navbar />

      <div className="pt-8">
        <header>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Practice
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
            Quick quiz
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Test your knowledge with {total || QUIZ_SIZE} questions about Blackfoot
            language and culture.
          </p>

          <TopActions right={<ExitButton onClick={() => navigate("/")} icon={Home} />} />

          {!submitted && total > 0 && (
            <div className="mt-6 max-w-2xl">
              <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-1">
                <span>
                  {step + 1}/{total}
                </span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-amber-50/70 overflow-hidden border border-[var(--border)]">
                <div
                  className="h-full bg-[var(--gold)] transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </header>

        {/* Card */}
        <Card className="mt-8 border border-rose-200/70">
          {loading ? (
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-3 rounded-xl border border-[#d4af37]/60 bg-white/70 px-4 py-3">
                <span className="h-3 w-3 animate-pulse rounded-full bg-[#a12222]" />
                <span className="text-sm text-[#6b2020]/80">Loading quiz…</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 sm:p-8">
              <div className="rounded-xl border border-rose-300 bg-rose-50/70 px-4 py-3 text-rose-700 text-sm">
                {error}
              </div>
              <div className="mt-6">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-lg border border-[#d4af37] bg-white/80 px-4 py-2 text-sm text-[#6b2020] hover:bg-[#fff5d6]"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          ) : !submitted ? (
            <div className="p-6 sm:p-8">
              {!current ? (
                <div className="text-sm text-[#6b2020]/80">
                  No quiz questions found.
                </div>
              ) : (
                <>
                  <h2 className="text-lg sm:text-xl font-semibold text-[#a12222]">
                    {current.prompt}
                  </h2>

                  <fieldset className="mt-4" aria-labelledby="question-label">
                    <legend id="question-label" className="sr-only">
                      Choose one answer
                    </legend>

                    <ul className="grid gap-3">
                      {current.options.map((opt, idx) => {
                        const id = `q${current.id}-opt${idx}`;
                        const selected = currentAnswer === idx;

                        return (
                          <li key={id}>
                            <label
                              htmlFor={id}
                              className={[
                                "flex w-full items-center gap-3 rounded-lg border p-3 sm:p-4 cursor-pointer transition",
                                selected
                                  ? "border-[#a12222] bg-rose-50/70 ring-1 ring-[#a12222]/50"
                                  : "border-[#d4af37]/50 hover:border-[#d4af37] hover:bg-amber-50/40",
                              ].join(" ")}
                            >
                              <input
                                id={id}
                                name={`question-${current.id}`}
                                type="radio"
                                className="h-4 w-4 accent-[#a12222]"
                                checked={selected || false}
                                onChange={() => selectOption(idx)}
                              />
                              <span className="text-sm sm:text-base text-[#6b2020]">
                                {opt}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </fieldset>

                  {/* Nav buttons */}
                  <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={prevStep}
                        disabled={step === 0}
                        variant="secondary"
                        leftIcon={ChevronLeft}
                      >
                        Previous
                      </Button>

                      {step < total - 1 ? (
                        <Button
                          type="button"
                          onClick={nextStep}
                          disabled={answers[step] === null}
                          rightIcon={ChevronRight}
                        >
                          Next
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={submit}
                          disabled={submitting || answers.some((a) => a === null)}
                          leftIcon={CheckCircle2}
                        >
                          {submitting ? "Submitting…" : "Submit"}
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button as={Link} to="/" variant="secondary" leftIcon={Home}>
                        Home
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            // Results
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-amber-50 to-rose-50 ring-1 ring-amber-300/50">
                  <Trophy className="h-6 w-6 text-amber-700" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#a12222]">
                    Your score: {score} / {total}
                  </h2>
                  <p className="text-sm text-[#6b2020]/80">
                    {score === total
                      ? "Perfect! Ínnikotsiistsi (well done)!"
                      : "Review the answers below and try again."}
                  </p>
                </div>
              </div>

              <ol className="mt-6 space-y-4">
                {questions.map((q, i) => {
                  const correct = isCorrect(i);
                  const chosenLabel =
                    answers[i] != null ? q.options[answers[i]] : "—";
                  const correctLabel =
                    q.answerIndex >= 0
                      ? q.options[q.answerIndex]
                      : String(q.correctAnswer ?? "—");

                  return (
                    <li
                      key={q.id}
                      className={[
                        "rounded-lg border p-4 text-sm",
                        correct
                          ? "border-emerald-400/70 bg-emerald-50/60"
                          : "border-rose-400/70 bg-rose-50/60",
                      ].join(" ")}
                    >
                      <p className="font-medium text-[#6b2020]">
                        {i + 1}. {q.prompt}
                      </p>
                      <p className="mt-2">
                        Your answer:{" "}
                        <span
                          className={
                            correct ? "text-emerald-700" : "text-rose-700"
                          }
                        >
                          {chosenLabel}
                        </span>
                        {!correct && (
                          <>
                            {" "}
                            • Correct:{" "}
                            <span className="text-emerald-700">
                              {correctLabel}
                            </span>
                          </>
                        )}
                      </p>
                      {q.help && (
                        <p className="mt-1 text-[#6b2020]/70">{q.help}</p>
                      )}
                    </li>
                  );
                })}
              </ol>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="button" onClick={reset} leftIcon={RotateCcw}>
                  Retake quiz
                </Button>
                <Button as={Link} to="/" variant="secondary" leftIcon={Home}>
                  Back to Home
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
