import Navbar from "../components/navbar";
import { Link } from "react-router-dom";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import {
  BookOpen,
  GraduationCap,
  ListChecks,
  Trophy,
  Feather,
  Languages,
  ArrowRight,
} from "lucide-react";

const CARDS = [
  {
    to: "/history",
    title: "Blackfoot History",
    description:
      "Learn about the stories, culture, and traditions of the Blackfoot people.",
    meta: "Cultural Section",
    icon: BookOpen,
    tone: "gold",
  },
  {
    to: "/games/flashcardthemes",
    title: "Flashcards",
    description: "Learn a little every day, the Blackfoot way.",
    meta: "Language Game",
    icon: GraduationCap,
    tone: "rose",
  },
  {
    to: "/games/fillinthegapthemes",
    title: "Blackfoot Builder",
    description: "Piece together meaning, one word at a time.",
    meta: "Language Game",
    icon: Languages,
    tone: "rose",
  },
  {
    to: "/leaderboard",
    title: "Leaderboard",
    description: "See top scores across games.",
    meta: "Progress",
    icon: Trophy,
    tone: "gold",
  },
  {
    to: "/games/shortstorieslist",
    title: "Voices of the Blackfoot",
    description:
      "Listen to stories and guess the dialect like a language detective.",
    meta: "Listening",
    icon: Feather,
    tone: "rose",
  },
  {
    to: "/games/quiz",
    title: "Quiz",
    description: "Quick questions and answers.",
    meta: "Practice",
    icon: ListChecks,
    tone: "rose",
  },
];

function cardTone(tone) {
  if (tone === "gold") {
    return {
      border: "border-[var(--border)]",
      badge: "bg-amber-50/70 text-[var(--text)] border-[var(--border)]",
      iconWrap:
        "bg-gradient-to-br from-amber-50 to-white ring-1 ring-amber-300/40",
      icon: "text-amber-700",
    };
  }
  return {
    border: "border-rose-200/70",
    badge: "bg-rose-50/70 text-[var(--text)] border-rose-200/70",
    iconWrap:
      "bg-gradient-to-br from-rose-50 to-white ring-1 ring-rose-300/40",
    icon: "text-[var(--brand)]",
  };
}

export default function Home() {
  return (
    <Page>
      <Navbar />

      <header className="pt-10 pb-6">
        <div className="max-w-4xl">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text)]">
            Learn Blackfoot through stories, practice, and games
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[var(--muted)]">
            Explore language learning activities and cultural context — designed
            for focused, daily progress.
          </p>
        </div>
      </header>

      <section className="pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {CARDS.map((c) => {
            const Icon = c.icon;
            const tone = cardTone(c.tone);

            return (
              <Card
                key={c.to}
                as={Link}
                to={c.to}
                className={[
                  "group p-5",
                  "border",
                  tone.border,
                  "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-900/5",
                  "transition",
                ].join(" ")}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={[
                      "grid h-12 w-12 place-items-center rounded-xl",
                      tone.iconWrap,
                    ].join(" ")}
                  >
                    <Icon className={["h-6 w-6", tone.icon].join(" ")} aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-base sm:text-lg font-semibold text-[var(--text)]">
                        {c.title}
                      </h2>
                      <ArrowRight
                        className="h-5 w-5 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition"
                        aria-hidden="true"
                      />
                    </div>

                    <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
                      {c.description}
                    </p>

                    <div className="mt-4">
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-2.5 py-1 text-xs",
                          tone.badge,
                        ].join(" ")}
                      >
                        {c.meta}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <footer className="pb-10">
        <Card className="p-5 text-sm text-[var(--muted)]">
          <div className="font-medium text-[var(--text)]">
            Acknowledgements & Sources
          </div>
          <p className="mt-2 leading-relaxed">
            Historical and language information draws on Blackfoot community
            language and cultural initiatives; scholarship on Niitsíʼpowahsin and
            Blackfoot history; and educational/public reference materials.
          </p>
          <p className="mt-2 text-xs uppercase tracking-wide text-[var(--muted)]">
            With deep respect to Blackfoot elders, speakers, and knowledge
            keepers.
          </p>
        </Card>
      </footer>
    </Page>
  );
}
