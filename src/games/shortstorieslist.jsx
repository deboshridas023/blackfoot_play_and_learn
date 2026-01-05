// src/pages/ShortStoriesList.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Navbar from "../components/navbar";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import TopActions, { ExitButton } from "../components/ui/TopActions";
import Button from "../components/ui/Button";
import { BookOpenText, Home, ArrowRight } from "lucide-react";

export default function ShortStoriesList() {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStories() {
      try {
        setLoading(true);
        const colRef = collection(db, "shortStories");
        const snap = await getDocs(colRef);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        if (!cancelled) setStories(data);
      } catch (err) {
        console.error("Firestore error (shortStories):", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStories();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Page className="flex items-center" containerClassName="py-16" variant="paper">
        <div className="w-full max-w-xl mx-auto text-center text-[var(--muted)]">
          Loading stories…
        </div>
      </Page>
    );
  }

  if (!stories.length) {
    return (
      <Page containerClassName="py-10" variant="paper">
        <Navbar />

        <header className="pt-10 pb-4">
          <div className="max-w-4xl">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Voices of the Blackfoot
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
              Stories
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              No stories found in the database.
            </p>
          </div>

          <TopActions right={<ExitButton onClick={() => navigate("/")} icon={Home} />} />
        </header>

        <Card className="p-6 text-center">
          <Button onClick={() => navigate("/")} leftIcon={Home}>
            Return home
          </Button>
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
            Voices of the Blackfoot
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
            Stories
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Listen, read the translation, and guess the dialect.
          </p>
        </div>

        <TopActions right={<ExitButton onClick={() => navigate("/")} icon={Home} />} />
      </header>

      <section className="pb-10">
        <div className="grid gap-4 md:grid-cols-2">
          {stories.map((story) => (
            <Card
              key={story.id}
              as="button"
              type="button"
              onClick={() => navigate(`/games/shortstoriesdetails/${story.id}`)}
              className="group text-left p-5 border border-rose-200/70 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-900/5 transition"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-50 to-white ring-1 ring-rose-300/40">
                  <BookOpenText className="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-[var(--text)]">
                        {story.englishtitle}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {story.blackfoottitle}
                      </p>
                    </div>

                    <ArrowRight
                      className="h-5 w-5 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition"
                      aria-hidden="true"
                    />
                  </div>

                  {story.description && (
                    <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed line-clamp-3">
                      {story.description}
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
