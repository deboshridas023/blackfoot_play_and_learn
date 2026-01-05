import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Navbar from "../components/navbar";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import TopActions, { ExitButton } from "../components/ui/TopActions";
import Button from "../components/ui/Button";
import { ArrowRight, Home, Layers3, Puzzle } from "lucide-react";

// Firestore (matches your screenshot):
// Collection: `blackfoot builder`
// Theme document example:
//   blackfoottitle: "Niitápihkiitaan"
//   englishtitle: "Making Bannock or Fry Bread"
// Sentences live in subcollection:
//   blackfoot builder/{themeId}/sentences/{sentenceId}
// with fields like:
//   blackfoot, english, answer, audio

export default function FillInTheGapThemes() {
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadThemes() {
      try {
        setLoading(true);
        // NOTE: Firestore collection names are case/space sensitive.
        // Your DB uses a space: `blackfoot builder`
        const colRef = collection(db, "blackfoot builder");
        const snap = await getDocs(colRef);
        const data = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            // allow numeric IDs like "1", "2" to sort in numeric order
            const an = Number(a.id);
            const bn = Number(b.id);
            if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
            return String(a.id).localeCompare(String(b.id));
          });
        if (!cancelled) setThemes(data);
      } catch (err) {
        console.error("Firestore error (blackfoot builder):", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadThemes();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Page className="flex items-center" containerClassName="py-16" variant="paper">
        <div className="w-full max-w-xl mx-auto text-center text-[var(--muted)]">
          Loading themes…
        </div>
      </Page>
    );
  }

  // Empty state (nice UX until you create the collection)
  if (!themes.length) {
    return (
      <Page containerClassName="py-10" variant="paper">
        <Navbar />

        <header className="pt-10 pb-4">
          <div className="max-w-4xl">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Blackfoot Builder
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
              Themes
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              No themes found in Firestore yet.
            </p>
          </div>

          <TopActions
            right={<ExitButton onClick={() => navigate("/")} icon={Home} />}
          />
        </header>

        <Card className="p-6 text-center">
          <div className="text-sm text-[var(--muted)]">
            Add documents to <span className="font-mono">blackfoot builder</span>
            {" "}to populate this page.
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate("/")} leftIcon={Home}>
              Return home
            </Button>
            <Button
              onClick={() => navigate("/games/fillinthegap")}
              variant="secondary"
              leftIcon={Puzzle}
            >
              Open builder (no theme)
            </Button>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page variant="paper">
      <Navbar />

      <header className="pt-10 pb-4">
        <div className="max-w-4xl">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Blackfoot Builder
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
            Choose a theme
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Fill in the missing word(s) using context and audio.
          </p>
        </div>

        <TopActions right={<ExitButton onClick={() => navigate("/")} icon={Home} />} />
      </header>

      <section className="pb-10">
        <div className="grid gap-4 md:grid-cols-2">
          {themes.map((t) => (
            <Card
              key={t.id}
              as="button"
              type="button"
              onClick={() => navigate(`/games/fillinthegap?themeId=${t.id}`)}
              className="group text-left p-5 border border-rose-200/70 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-900/5 transition"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-50 to-white ring-1 ring-rose-300/40">
                  <Layers3 className="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-[var(--text)]">
                        {t.englishtitle || "Untitled theme"}
                      </h2>
                      {t.blackfoottitle && (
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {t.blackfoottitle}
                        </p>
                      )}
                    </div>
                    <ArrowRight
                      className="h-5 w-5 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition"
                      aria-hidden="true"
                    />
                  </div>

                  {t.description && (
                    <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed line-clamp-3">
                      {t.description}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </Page>
  );
}
