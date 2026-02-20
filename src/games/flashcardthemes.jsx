import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import Navbar from "../components/navbar";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import TopActions, { ExitButton } from "../components/ui/TopActions";
import { Layers3, ArrowRight, Home, LogOut } from "lucide-react";
import Button from "../components/ui/Button";

const THEMES = [
  { slug: "animals", title: "Animals", tagline: "Creatures great & small" },
  { slug: "days", title: "Days of the Week", tagline: "The journey of the week" },
  { slug: "body-parts", title: "Body Parts", tagline: "Head to toe" },
  { slug: "clothing", title: "Clothing", tagline: "Made to be worn" }
];

const DIALECTS = ["Kainai", "Piikani", "Siksika"];

export default function FlashcardThemes() {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function checkAvailability() {
      try {
        const results = {};
        const promises = [];

        THEMES.forEach((theme) => {
          results[theme.slug] = {};
          DIALECTS.forEach((dialect) => {
            const colRef = collection(db, `flashcards/dnvSyiAbhumktOGFUy3s/${theme.slug}`);
            const q = query(colRef, where("dialect", "==", dialect), limit(1));
            promises.push(
              getDocs(q).then((snap) => {
                if (!cancelled) {
                  results[theme.slug][dialect] = !snap.empty;
                }
              })
            );
          });
        });

        await Promise.all(promises);
        if (!cancelled) {
          setAvailability(results);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error checking dialect availability:", err);
        if (!cancelled) setLoading(false);
      }
    }

    checkAvailability();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleexit = async () => {
    navigate("/"); 
  };
  return (
    <Page>
      <Navbar />

      <header className="pt-10 pb-4">
        <div className="max-w-4xl">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Flashcards
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
            Choose a theme
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Practice high-frequency vocabulary with audio and images.
          </p>
        </div>
        {/* Dialect buttons will be shown per-theme inside each card */}

        <TopActions
          right={
            <>
              <ExitButton onClick={handleexit} icon={Home}>
                Exit to Home
              </ExitButton>
            </>
          }
        />
      </header>

      <section className="pb-10">
        <div className="grid gap-4">
          {THEMES.map((t) => (
            <Card
              key={t.slug}
              className="relative p-4 sm:p-5 border border-rose-200/70 transition"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-rose-50 to-white ring-1 ring-rose-300/40">
                    <Layers3 className="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-[var(--text)]">
                      {t.title}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {t.tagline}
                    </p>
                  </div>
                </div>

                {/* Right side: dialect buttons (rectangular visible buttons) */}
                <div className="flex items-center gap-2">
                  {DIALECTS.map((d) => {
                    const isAvailable = availability[t.slug]?.[d];
                    return (
                      <Button
                        key={d}
                        onClick={() => {
                          if (isAvailable) {
                            navigate({
                              pathname: `/games/flashcards/${t.slug}`,
                              search: `?dialect=${d}`,
                            });
                          }
                        }}
                        variant={"secondary"}
                        className={
                          isAvailable
                            ? "px-3 py-1 text-sm hover:!bg-[var(--brand-2)] hover:!text-white hover:!border-[var(--brand-2)]"
                            : "px-3 py-1 text-sm opacity-40 cursor-not-allowed"
                        }
                        disabled={!isAvailable || loading}
                      >
                        {d}
                      </Button>
                    );
                  })}
                </div>
              </div>
            
            {/* Tile is non-clickable; only the dialect buttons are interactive */}
            </Card>
          ))}
        </div>
      </section>
    </Page>
  );
}
