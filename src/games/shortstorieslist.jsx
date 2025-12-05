// src/pages/ShortStoriesList.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Navbar from "../components/navbar";

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
      <div className="min-h-screen flex items-center justify-center bg-[#f8f1ec] text-[#6b2020]">
        <p>Loading stories...</p>
      </div>
    );
  }

  if (!stories.length) {
    return (
      <div className="min-h-screen bg-[#f8f1ec] text-[#6b2020]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-serif mb-4">Short Stories & Tales</h1>
          <p>No stories found in the database.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 px-4 py-2 bg-[#c54b4b] text-[#fffaf8] rounded hover:bg-[#a63e3e] transition-all duration-200"
          >
            Return Home
          </button>
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
          Short Stories & Tales
        </h1>

        <div className="grid gap-5 md:grid-cols-2">
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => navigate(`/games/shortstoriesdetails/${story.id}`)}
              className="text-left bg-[#fff4f4] border border-[#e3a4a4] rounded-xl p-5 shadow-sm
                         hover:shadow-md hover:border-[#d4af37] hover:shadow-[#d4af37]/40
                         transition-all duration-200 cursor-pointer"
            >
              {/* English title */}
              <h2 className="text-xl font-semibold text-[#a12222] font-serif">
                {story.englishtitle}
              </h2>

              {/* Blackfoot title */}
              <p className="mt-1 text-sm text-[#6b2020]/80 italic">
                {story.blackfoottitle}
              </p>

              {/* Description */}
              <p className="mt-3 text-sm leading-relaxed text-[#5a1b1b] line-clamp-3">
                {story.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
