import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom"; 
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

export default function FlashcardThemes() {
  const navigate = useNavigate();
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
              as={Link}
              to={`/games/flashcards/${t.slug}`}
              className="group p-4 sm:p-5 border border-rose-200/70 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-900/5 transition"
            >
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-rose-50 to-white ring-1 ring-rose-300/40">
                  <Layers3 className="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-[var(--text)]">
                        {t.title}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {t.tagline}
                      </p>
                    </div>

                    <ArrowRight
                      className="h-5 w-5 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </Page>
  );
}
