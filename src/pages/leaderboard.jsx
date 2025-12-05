import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function useLeaderboardData() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const snap = await getDocs(collection(db, "users"));
        if (cancelled) return;

        const mapped = snap.docs.map((d) => {
          const data = d.data() || {};
          const quiz = Number(data.quizScore || 0);
          const stories = Number(data.shortStoriesScore || 0);
          const builder = Number(data.builderScore || 0);
          const email = d.id || data.email || "";
          const display =
            data.displayName ||
            (email.includes("@") ? email.split("@")[0] : email || "Unknown");

          return {
            id: d.id,
            email,
            name: display,
            quizScore: quiz,
            shortStoriesScore: stories,
            builderScore: builder,
            total: quiz + stories + builder,
          };
        });

        setRows(mapped);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        setErr("Failed to load scores. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, loading, error };
}

function rankWithTies(sortedItems, scoreKey) {
  // Expect sorted desc by scoreKey
  let prevScore = null;
  let prevRank = 0;
  return sortedItems.map((item, idx) => {
    const score = item[scoreKey] ?? 0;
    const rank = score === prevScore ? prevRank : idx + 1;
    prevScore = score;
    prevRank = rank;
    return { ...item, rank };
  });
}

function LeaderboardTable({ title, items, scoreKey, currentEmail }) {
  const ranked = useMemo(() => rankWithTies(items, scoreKey), [items, scoreKey]);

  return (
    <section className="rounded-2xl border border-[#d4af37]/50 bg-white/80 shadow-sm backdrop-blur">
      <header className="flex items-center justify-between p-4 sm:p-5 border-b border-[#d4af37]/40">
        <h3 className="text-lg sm:text-xl font-semibold text-[#a12222]">{title}</h3>
        <span className="text-xs sm:text-sm text-[#6b2020]/70">
          Players: {items.length}
        </span>
      </header>

      {items.length === 0 ? (
        <div className="p-6 text-center text-[#6b2020]/70">No scores yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[#6b2020]/70">
                <th className="px-4 py-3 sm:px-6">Rank</th>
                <th className="px-4 py-3 sm:px-6">Player</th>
                <th className="px-4 py-3 sm:px-6 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((row, i) => {
                const isYou = row.email && currentEmail && row.email === currentEmail;
                const isTop = row.rank === 1 && (row[scoreKey] ?? 0) > 0;

                return (
                  <tr
                    key={row.email || row.id || i}
                    className={classNames(
                      "text-sm",
                      i % 2 === 0 ? "bg-white/70" : "bg-amber-50/50"
                    )}
                  >
                    <td className="px-4 py-3 sm:px-6 align-middle">
                      <div className="inline-flex items-center gap-2">
                        <span
                          className={classNames(
                            "inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2",
                            isTop
                              ? "border-[#d4af37] bg-[#fff5d6] text-[#6b2020] font-semibold"
                              : "border-[#d4af37]/50 text-[#6b2020]"
                          )}
                          title={`Rank #${row.rank}`}
                        >
                          {row.rank}
                        </span>
                        {isTop && <span className="text-lg">🏆</span>}
                      </div>
                    </td>

                    <td className="px-4 py-3 sm:px-6 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-amber-50 to-rose-50 ring-1 ring-amber-300/50">
                          <span className="text-sm">
                            {row.name?.[0]?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={classNames(
                              "font-medium",
                              isYou ? "text-[#a12222]" : "text-[#6b2020]"
                            )}
                          >
                            {row.name || "Unknown"}
                            {isYou && (
                              <span className="ml-2 text-xs text-emerald-700 align-middle">
                                (You)
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-[#6b2020]/60">
                            {row.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 sm:px-6 align-middle text-right">
                      <span className="inline-flex items-center gap-2 px-2 py-1 rounded border text-[#6b2020] border-[#d4af37]/60 bg-white/60">
                        <span className="text-sm font-semibold">
                          {row[scoreKey] ?? 0}
                        </span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Leaderboard() {
  const { rows, loading, error } = useLeaderboardData();
  const currentEmail = auth.currentUser?.email || null;
  const navigate = useNavigate();

  const [tab, setTab] = useState("overall"); // overall | quiz | stories

  const overall = useMemo(() => {
    return [...rows].sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  }, [rows]);

  const quiz = useMemo(() => {
    return [...rows].sort((a, b) => (b.quizScore ?? 0) - (a.quizScore ?? 0));
  }, [rows]);

  const stories = useMemo(() => {
    return [...rows].sort(
      (a, b) => (b.shortStoriesScore ?? 0) - (a.shortStoriesScore ?? 0)
    );
  }, [rows]);

  const builder = useMemo(() => {
    return [...rows].sort(
      (a, b) => (b.builderScore ?? 0) - (a.builderScore ?? 0)
    );
  }, [rows]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffaf8] via-[#fff7ef] to-[#ffeeda] text-[#381010]">
      <Navbar />

      <div className="flex justify-between px-6 mt-4">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f] transition-all duration-200"
        >
          ← Back
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f] transition-all duration-200"
        >
          Exit & Return Home
        </button>
      </div>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <header className="mb-6 sm:mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#6b2020] tracking-tight">
            Leaderboard
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#6b2020]/80">
            See how everyone is doing across games. Scores update as you play.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: "overall", label: "Overall" },
              { key: "quiz", label: "Quiz" },
              { key: "builder", label: "Blackfoot Builder" },
              { key: "stories", label: "Voices of the Blackfoot" },
            ].map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={classNames(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                    active
                      ? "bg-[#a12222] text-white border-[#a12222]"
                      : "bg-white/80 text-[#6b2020] border-[#d4af37]/60 hover:bg-[#fff5d6]"
                  )}
                >
                  {t.label}
                  {active && <span>•</span>}
                </button>
              );
            })}
          </div>
        </header>

        {loading ? (
          <div className="grid place-items-center py-20">
            <div className="inline-flex items-center gap-3 rounded-xl border border-[#d4af37]/60 bg-white/70 px-4 py-3">
              <span className="h-3 w-3 animate-pulse rounded-full bg-[#a12222]" />
              <span className="text-sm text-[#6b2020]/80">Loading scores…</span>
            </div>
          </div>
        ) : error ? (
          <div className="grid place-items-center py-20">
            <div className="rounded-xl border border-rose-300 bg-rose-50/70 px-4 py-3 text-rose-700 text-sm">
              {error}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {tab === "overall" && (
              <LeaderboardTable
                title="Overall Leaderboard"
                items={overall}
                scoreKey="total"
                currentEmail={currentEmail}
              />
            )}
            {tab === "quiz" && (
              <LeaderboardTable
                title="Quiz Leaderboard"
                items={quiz}
                scoreKey="quizScore"
                currentEmail={currentEmail}
              />
            )}
            {tab === "builder" && (
              <LeaderboardTable
                title="Blackfoot Builder Leaderboard"
                items={builder}
                scoreKey="builderScore"
                currentEmail={currentEmail}
              />
            )}
            {tab === "stories" && (
              <LeaderboardTable
                title="Voices of the Blackfoot Leaderboard"
                items={stories}
                scoreKey="shortStoriesScore"
                currentEmail={currentEmail}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
