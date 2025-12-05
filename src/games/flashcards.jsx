import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { db, storage } from "../firebase";
import { ref, getDownloadURL } from "firebase/storage";
import { collection, getDocs } from "firebase/firestore";
import Navbar from "../components/navbar";

export default function Flashcards() {
  const { theme } = useParams();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const audioRef = useRef(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCards() {
      try {
        setLoading(true);
        const colRef = collection(
          db,
          `flashcards/dnvSyiAbhumktOGFUy3s/${theme}`
        );
        const snap = await getDocs(colRef);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        if (!cancelled) {
          setCards(data);
          setIndex(0);
          setFlipped(false);
          setCompleted(false);
        }
      } catch (err) {
        console.error("Firestore error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCards();
    return () => (cancelled = true);
  }, [theme]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [flipped, index]);

  useEffect(() => {
    async function loadImage() {
      try {
        if (!cards[index]?.image) {
          setImage(null);
          return;
        }
        const imageRef = ref(
          storage,
          `blackfootimages/${cards[index].image}`
        );
        const url = await getDownloadURL(imageRef);
        setImage(url);
      } catch (err) {
        console.error("Image fetch error:", err);
        setImage(null);
      }
    }
    loadImage();
  }, [index, cards]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f1ec] text-[#6b2020]">
        <p>Loading cards...</p>
      </div>
    );

  if (!cards.length)
    return (
      <div className="text-[#6b2020] text-center p-20 bg-[#f8f1ec]">
        No flashcards found for: {theme}
      </div>
    );

  const current = cards[index];

  const handleFlip = () => setFlipped(!flipped);
  const handleNext = () => {
    if (index + 1 < cards.length) {
      setIndex(index + 1);
      setFlipped(false);
    } else setCompleted(true);
  };
  const handlePrev = () => {
    if (index > 0) {
      setIndex(index - 1);
      setFlipped(false);
    }
  };
  const restart = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setIndex(0);
    setFlipped(false);
    setCompleted(false);
  };

  async function playAudio() {
    try {
      if (!current?.audio) return;
      const audioRefPath = ref(storage, `blackfootaudios/${current.audio}`);
      const url = await getDownloadURL(audioRefPath);
      if (!audioRef.current) audioRef.current = new Audio(url);
      else audioRef.current.src = url;
      await audioRef.current.play();
    } catch (err) {
      console.error("🎵 Audio playback error:", err);
    }
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-[#f8f1ec] text-[#6b2020] flex flex-col items-center justify-center space-y-6">
        <h2 className="text-3xl font-serif tracking-wide">
          You completed {theme}!
        </h2>
        <div className="flex gap-6">
          <button
            onClick={restart}
            className="px-5 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f]"
          >
            Restart
          </button>
          <button
            onClick={() => navigate("/games/flashcardthemes")}
            className="px-5 py-2 border border-[#d4af37] text-[#6b2020] rounded hover:bg-[#d4af37]/20"
          >
            Back to Themes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col text-[#6b2020]"
      style={{
        background:
          "linear-gradient(rgba(247, 230, 228, 0.95), rgba(240, 220, 216, 0.98)), url('https://www.transparenttextures.com/patterns/aged-paper.png')",
        backgroundRepeat: "repeat",
      }}
    >
      <Navbar />

      {/* ⭐ Unified Button Bar — SAME styling & same row */}
      <div className="flex justify-between px-6 mt-4">
        <button
          onClick={() => navigate("/games/flashcardthemes")}
          className="px-4 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f] transition-all duration-200"
        >
          ← Back to Themes
        </button>

        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f] transition-all duration-200"
        >
          Exit Game & Return Home
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="relative w-[320px] h-[460px] sm:w-[380px] sm:h-[500px] perspective">
          <div
            className={`relative w-full h-full duration-500 transform-style-preserve-3d ${
              flipped ? "rotate-y-180" : ""
            }`}
          >
            {/* FRONT */}
            <div
              onClick={handleFlip}
              className="absolute w-full h-full bg-[#fff2f2] rounded-2xl shadow-[0_8px_24px_rgba(197,75,75,0.3)]
                         p-6 border border-[#e3a4a4] backface-hidden flex flex-col items-center justify-center gap-6 cursor-pointer"
            >
              <p className="text-3xl font-serif tracking-wide text-[#a12222]">
                {current.english}
              </p>
              <p className="text-sm text-[#6b2020]/70">(tap to flip)</p>
            </div>

            {/* BACK */}
            <div
              className="absolute w-full h-full bg-[#fff2f2] rounded-2xl shadow-[0_8px_24px_rgba(197,75,75,0.3)]
                         p-6 border border-[#e3a4a4] backface-hidden flex flex-col justify-between rotate-y-180"
            >
              <div className="text-2xl font-serif text-center mt-4 text-[#a12222]">
                {current.blackfoot}
              </div>

              <div className="flex flex-col items-center justify-center text-[#6b2020]">
                <div className="text-lg mb-2">
                  🎧 {current.audio || "No audio file"}
                </div>
                {current.audio && (
                  <button
                    onClick={playAudio}
                    className="px-4 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f] transition"
                  >
                    ▶ Play Audio
                  </button>
                )}
              </div>

              <div className="flex justify-center mt-4">
                {image ? (
                  <img
                    src={image}
                    alt={current.english}
                    className="w-48 h-48 object-cover rounded-lg border border-[#e3a4a4]"
                  />
                ) : (
                  <div className="w-48 h-48 bg-[#f7dcdc] rounded-lg flex items-center justify-center text-[#a12222]/70 text-sm">
                    No image
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 bg-[#d4af37] rounded text-black disabled:opacity-30"
                  disabled={index === 0}
                >
                  Prev
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-[#d4af37] rounded text-black"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
