import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import TopActions, { BackButton, ExitButton } from "../components/ui/TopActions";
import Button from "../components/ui/Button";
import { auth, db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { ChevronLeft, Home, Trophy } from "lucide-react";

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
    <Card className="border border-rose-200/70">
      <header className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)]">
        <h3 className="text-base sm:text-lg font-semibold text-[var(--text)]">{title}</h3>
        <span className="text-xs sm:text-sm text-[var(--muted)]">Players: {items.length}</span>
      </header>

      {items.length === 0 ? (
        <div className="p-6 text-center text-[var(--muted)]">No scores yet.</div>
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
                              ? "border-[var(--border)] bg-amber-50/70 text-[var(--text)] font-semibold"
                              : "border-[var(--border)] text-[var(--text)]"
                          )}
                          title={`Rank #${row.rank}`}
                        >
                          {row.rank}
                        </span>
                        {isTop && <Trophy className="h-4 w-4 text-amber-700" aria-hidden="true" />}
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
    </Card>
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
    <Page variant="paper">
      <Navbar />

      <div className="pt-8">
        <header>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Progress
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
            Leaderboard
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Scores update as you play.
          </p>

          <TopActions
            left={<BackButton onClick={() => navigate(-1)} icon={ChevronLeft} />}
            right={<ExitButton onClick={() => navigate("/")} icon={Home} />}
          />

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { key: "overall", label: "Overall" },
              { key: "quiz", label: "Quiz" },
              { key: "builder", label: "Blackfoot Builder" },
              { key: "stories", label: "Voices of the Blackfoot" },
            ].map((t) => {
              const active = tab === t.key;
              return (
                <Button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  variant={active ? "primary" : "secondary"}
                  className={classNames(
                    "rounded-full",
                    active ? "" : "bg-white/70"
                  )}
                >
                  {t.label}
                </Button>
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
          <div className="mt-8 pb-12 space-y-6">
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
      </div>
    </Page>
  );
}
