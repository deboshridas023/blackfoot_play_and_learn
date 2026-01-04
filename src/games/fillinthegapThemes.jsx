import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Navbar from "../components/navbar";

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
      <div className="min-h-screen flex items-center justify-center bg-[#f8f1ec] text-[#6b2020]">
        <p>Loading themes...</p>
      </div>
    );
  }

  // Empty state (nice UX until you create the collection)
  if (!themes.length) {
    return (
      <div className="min-h-screen bg-[#f8f1ec] text-[#6b2020]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-serif mb-4">Blackfoot Builder Themes</h1>
          <p>
            No themes found in Firestore. Add documents to
            <span className="font-mono"> blackfoot builder</span> to populate this
            page.
          </p>

          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-[#c54b4b] text-[#fffaf8] rounded hover:bg-[#a63e3e] transition-all duration-200"
            >
              Return Home
            </button>
            <button
              onClick={() => navigate("/games/fillinthegap")}
              className="px-4 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f] transition-all duration-200"
            >
              Play Default Builder
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f8f1ec] text-[#6b2020]"
      style={{
        background:
          "linear-gradient(rgba(247, 230, 228, 0.95), rgba(240, 220, 216, 0.98)), url('https://www.transparenttextures.com/patterns/aged-paper.png')",
        backgroundRepeat: "repeat",
      }}
    >
      <Navbar />

      <div className="flex justify-end px-6 mt-4">
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-[#c54b4b] text-[#fffaf8] rounded hover:bg-[#a63e3e] transition-all duration-200"
        >
          Exit & Return Home
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-serif text-[#a12222] mb-6">
          Blackfoot Builder Themes
        </h1>

        <div className="grid gap-5 md:grid-cols-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(`/games/fillinthegap?themeId=${t.id}`)}
              className="text-left bg-[#fff4f4] border border-[#e3a4a4] rounded-xl p-5 shadow-sm
                         hover:shadow-md hover:border-[#d4af37] hover:shadow-[#d4af37]/40
                         transition-all duration-200 cursor-pointer"
            >
              <h2 className="text-xl font-semibold text-[#a12222] font-serif">
                {t.englishtitle || "Untitled theme"}
              </h2>

              {t.blackfoottitle && (
                <p className="mt-1 text-sm text-[#6b2020]/80 italic">
                  {t.blackfoottitle}
                </p>
              )}

              {t.description && (
                <p className="mt-3 text-sm leading-relaxed text-[#5a1b1b] line-clamp-3">
                  {t.description}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
