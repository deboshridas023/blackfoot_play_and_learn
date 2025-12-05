import React, { useMemo, useState } from "react";
import Navbar from "../components/navbar";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

const QUESTIONS = [
  {
    id: 1,
    prompt: "Which name refers to the Blackfoot language?",
    options: ["Niitsíʼpowahsin", "Inuktitut", "Ojibwe", "Lakota"],
    answerIndex: 0,
    help: "Niitsíʼpowahsin is the Blackfoot language.",
  },
  {
    id: 2,
    prompt: "A traditional dwelling used by Blackfoot people is the…",
    options: ["Longhouse", "Igloo", "Tipi", "Hogan"],
    answerIndex: 2,
    help: "The tipi is a conical tent used by many Plains peoples, including the Blackfoot.",
  },
  {
    id: 3,
    prompt:
      "Siksiká, Kainai, and Piikáni are Nations within which confederacy?",
    options: [
      "Haudenosaunee Confederacy",
      "Blackfoot Confederacy",
      "Anishinaabe Council",
      "Salish Alliance",
    ],
    answerIndex: 1,
    help: "They are part of the Blackfoot (Niitsitapi) Confederacy.",
  },
];

export default function Quiz() {
  const total = QUESTIONS.length;
  const [step, setStep] = useState(0); // 0..(total-1)
  const [answers, setAnswers] = useState(Array(total).fill(null)); // store option index
  const [submitted, setSubmitted] = useState(false);

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

  const current = QUESTIONS[step];
  const currentAnswer = answers[step];

  const score = useMemo(
    () =>
      answers.reduce(
        (acc, ans, i) => acc + (ans === QUESTIONS[i].answerIndex ? 1 : 0),
        0
      ),
    [answers]
  );

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
    await addQuizPointsForUser(score);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setAnswers(Array(total).fill(null));
    setSubmitted(false);
    setStep(0);
  }

  const progressPct = Math.round(((step + 1) / total) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffaf8] via-[#fff7ef] to-[#ffeeda] text-[#381010]">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#6b2020] tracking-tight">
            Quick Quiz
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#6b2020]/80">
            Test your knowledge with 3 short questions about Blackfoot language
            and culture.
          </p>

          {/* Progress */}
          {!submitted && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-[#6b2020]/80 mb-1">
                <span>
                  Question {step + 1} of {total}
                </span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#d4af37]/20 overflow-hidden">
                <div
                  className="h-full bg-[#d4af37] transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </header>

        {/* Card */}
        <section className="relative overflow-hidden rounded-2xl border border-[#d4af37]/50 bg-white/80 shadow-sm backdrop-blur">
          {!submitted ? (
            <div className="p-6 sm:p-8">
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
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={step === 0}
                    className={[
                      "inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm",
                      step === 0
                        ? "border-[#6b2020]/20 text-[#6b2020]/40 cursor-not-allowed"
                        : "border-[#d4af37] text-[#6b2020] hover:bg-[#fff5d6]",
                    ].join(" ")}
                  >
                    ← Previous
                  </button>

                  {step < total - 1 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={answers[step] === null}
                      className={[
                        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm text-white",
                        answers[step] === null
                          ? "bg-[#a12222]/50 cursor-not-allowed"
                          : "bg-[#a12222] hover:bg-[#8c1d1d]",
                      ].join(" ")}
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={submit}
                      disabled={answers.some((a) => a === null)}
                      className={[
                        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm text-white",
                        answers.some((a) => a === null)
                          ? "bg-[#a12222]/50 cursor-not-allowed"
                          : "bg-[#a12222] hover:bg-[#8c1d1d]",
                      ].join(" ")}
                    >
                      Submit ✓
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center rounded-lg border border-[#d4af37] bg-white/80 px-4 py-2 text-sm text-[#6b2020] hover:bg-[#fff5d6]"
                  >
                    Home
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            // Results
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-amber-50 to-rose-50 ring-1 ring-amber-300/50">
                  <span className="text-2xl">🏆</span>
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
                {QUESTIONS.map((q, i) => {
                  const correct = q.answerIndex === answers[i];
                  const chosenLabel =
                    answers[i] != null ? q.options[answers[i]] : "—";
                  const correctLabel = q.options[q.answerIndex];

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
                      <p className="mt-1 text-[#6b2020]/70">{q.help}</p>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center justify-center rounded-lg bg-[#a12222] px-4 py-2 text-sm text-white hover:bg-[#8c1d1d]"
                >
                  Retake quiz
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-lg border border-[#d4af37] bg-white/80 px-4 py-2 text-sm text-[#6b2020] hover:bg-[#fff5d6]"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
