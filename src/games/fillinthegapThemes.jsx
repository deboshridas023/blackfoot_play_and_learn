import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, query, where, limit, collectionGroup } from "firebase/firestore";
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
  const location = useLocation();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialect, setDialect] = useState("All");

  // Keep dialect state in sync with the URL query param (so bookmarks / direct links work)
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const d = params.get("dialect") || "All";
      if (d !== dialect) setDialect(d);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

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
        if (cancelled) return;

        // Debug: log loaded theme docs and selected dialect to help troubleshoot filtering
        // (remove these logs after verifying behavior)
        // eslint-disable-next-line no-console
        console.debug("[fillinthegapThemes] loaded themes count=", data.length, "dialect=", dialect);
        // eslint-disable-next-line no-console
        console.debug("[fillinthegapThemes] sample themes=", data.slice(0,5).map(t => ({ id: t.id, dialect: t.dialect })));

        if (!dialect || dialect === "All") {
          setThemes(data);
          return;
        }

        // Quick path: many of your theme docs include a top-level `dialect` field.
        // Prefer filtering by that field first (fast, no extra reads).
        const byThemeField = data.filter((t) => {
          if (!t || t.dialect == null) return false;
          try {
            return String(t.dialect).toLowerCase() === String(dialect).toLowerCase();
          } catch {
            return false;
          }
        });
        if (byThemeField.length) {
          setThemes(byThemeField);
          return;
        }

        // Use a collectionGroup query to find sentences across all themes that match the dialect.
        // This is a single query (faster) and avoids per-theme sampling.
        try {
          // Debug
          // eslint-disable-next-line no-console
          console.debug("[fillinthegapThemes] falling back to collectionGroup scan for dialect=", dialect);
          // Use a collectionGroup scan (limited) and filter client-side tolerant to different shapes/casing.
          const cg = collectionGroup(db, "sentences");
          // Limit the scan to a reasonable number to avoid huge reads; adjust if you have many sentences.
          const q = query(cg, limit(500));
          const snapDialect = await getDocs(q);
          // Debug
          // eslint-disable-next-line no-console
          console.debug("[fillinthegapThemes] collectionGroup returned", snapDialect.size, "sentence docs (sample)");
          const themeIdSet = new Set();

          snapDialect.forEach((sDoc) => {
            try {
              const s = sDoc.data();
              if (!s) return;
              const match = (() => {
                if (typeof s.dialect === "string" && String(s.dialect).toLowerCase() === String(dialect).toLowerCase()) return true;
                if (Array.isArray(s.dialects) && s.dialects.map(String).map(x => x.toLowerCase()).includes(String(dialect).toLowerCase())) return true;
                // tolerate simple substring matches, e.g., accented vs unaccented
                if (typeof s.dialect === "string" && String(s.dialect).toLowerCase().includes(String(dialect).toLowerCase())) return true;
                return false;
              })();

              if (match) {
                const parent = sDoc.ref.parent; // sentences collection ref
                const themeRef = parent.parent; // theme doc ref
                if (themeRef && themeRef.id) themeIdSet.add(themeRef.id);
              }
            } catch (err) {
              // continue
            }
          });

          const filtered = data.filter((t) => themeIdSet.has(String(t.id)));
          if (!cancelled) setThemes(filtered);
        } catch (err) {
          console.error("Error running collectionGroup dialect query:", err);
          if (!cancelled) setThemes([]);
        }
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
  }, [dialect]);

  if (loading) {
    return (
      <Page className="flex items-center" containerClassName="py-16" variant="paper">
        <div className="w-full max-w-xl mx-auto text-center text-[var(--muted)]">
          Loading themes…
        </div>
      </Page>
    );
  }

  // If there are no themes for the selected dialect we still render the page layout
  // but show an inline empty-state message in the themes grid area so the header
  // and dialect selector remain visible and the page doesn't appear to navigate.

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

        {/* Dialect selector (global for the page) */}
        <div className="mt-4 flex items-center gap-2">
          <div className="text-xs text-[var(--muted)]">Dialect:</div>
          <div className="inline-flex gap-2">
            {[
              "All",
              "Kainai",
              "Piikani",
              "Siksika",
            ].map((d) => (
              <Button
                key={d}
                onClick={() => {
                  // update local state and keep dialect in the URL so the filter is shareable
                  setDialect(d);
                  const search = d && d !== "All" ? `?dialect=${encodeURIComponent(d)}` : "";
                  navigate({ pathname: location.pathname, search }, { replace: true });
                }}
                variant={dialect === d ? "primary" : "secondary"}
                size="sm"
              >
                {d}
              </Button>
            ))}
          </div>
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
              className="group text-left p-5 border border-rose-200/70 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-900/5 transition relative"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-50 to-white ring-1 ring-rose-300/40">
                    <Layers3 className="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-semibold text-[var(--text)]">
                      {t.englishtitle || "Untitled theme"}
                    </h2>
                    {t.blackfoottitle && (
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {t.blackfoottitle}
                      </p>
                    )}

                    {t.description && (
                      <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed line-clamp-3">
                        {t.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Make the whole tile open the theme; include dialect if selected */}
                <div
                  className="absolute inset-0"
                  onClick={() =>
                    navigate(
                      `/games/fillinthegap?themeId=${t.id}${dialect && dialect !== "All" ? `&dialect=${encodeURIComponent(dialect)}` : ""}`
                    )
                  }
                  aria-hidden
                />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </Page>
  );
}
