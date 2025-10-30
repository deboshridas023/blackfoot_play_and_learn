import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { db, storage } from "../firebase";          
import { ref, getDownloadURL } from "firebase/storage";
import { collection, getDocs } from "firebase/firestore";

export default function Flashcards() {
  const { theme } = useParams();
  const navigate = useNavigate();

  //const cards = MOCK_DATA[theme] || [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const audioRef = useRef(null);


    // ✅ FETCH DATA FROM FIRESTORE
  useEffect(() => {
    let cancelled = false;

   

    async function loadCards() {
      try {
        setLoading(true);
        console.log("🔍 Loading cards for theme:", theme);

        // ✅ EXACT PATH FROM YOUR SCREENSHOT
        const colRef = collection(db, "flashcards/dnvSyiAbhumktOGFUy3s/animals");
        const snap = await getDocs(colRef);
        console.log("📄 Documents fetched:", snap.size);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log("✅ Firestore returned:", data.toString);

        if (!cancelled) {
          setCards(data);
          setIndex(0);
          setFlipped(false);
          setCompleted(false);
        }
      } catch (err) {
        console.error("🔥 Firestore error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCards();
    return () => {
      cancelled = true;
    };

    
  }, [theme]);

  useEffect(() => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }
}, [flipped, index]);

   // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#2c241f]">
        <p>Loading cards...</p>
      </div>
    );
  }
      
  if (!cards.length) {
    return (
      <div className="text-white text-center p-20">
        No flashcards found for: {theme}
      </div>
    );
  }

  

  const current = cards[index];

  const handleFlip = () => setFlipped(!flipped);

  const handleNext = () => {
    if (index + 1 < cards.length) {
      setIndex(index + 1);
      setFlipped(false);
    } else {
      setCompleted(true);
    }
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

    // Get full download URL from Firebase Storage
    const audioRefPath = ref(storage, `blackfootaudios/${current.audio}`);
    const url = await getDownloadURL(audioRefPath);

    // Re-use existing Audio object or create a new one
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
    } else {
      audioRef.current.src = url;
    }

    await audioRef.current.play();
  } catch (err) {
    console.error("🎵 Audio playback error:", err);
  }
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-[#2c241f] text-white flex flex-col items-center justify-center space-y-6">
        <h2 className="text-3xl font-serif tracking-wider">
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
            className="px-5 py-2 border border-[#d4af37] text-[#d4af37] rounded hover:bg-[#d4af37]/20"
          >
            Back to Themes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2c241f] text-white">
  <div className="relative w-[320px] h-[460px] sm:w-[380px] sm:h-[500px] perspective">
    <div
      className={`relative w-full h-full duration-500 transform-style-preserve-3d ${
        flipped ? "rotate-y-180" : ""
      }`}
    >
      {/* FRONT */}
      <div
        onClick={handleFlip}
        className="absolute w-full h-full bg-[#f7f0e3] rounded-xl shadow-2xl p-6 border-4 border-[#c9b89a]
                   backface-hidden flex flex-col items-center justify-center gap-6"
      >
        <p className="text-3xl font-serif tracking-wide text-black">
          {current.english}
        </p>
        <p className="text-sm text-gray-500">(tap to flip)</p>
      </div>

      {/* BACK */}
      <div
        className="absolute w-full h-full bg-[#f7f0e3] rounded-xl shadow-2xl p-6 border-4 border-[#c9b89a]
                   backface-hidden flex flex-col justify-between rotate-y-180"
      >
        <div className="text-2xl font-serif text-center mt-6 text-black">
          {current.blackfoot}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-black">
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


        <div className="flex-1 flex items-center justify-center">
          <div className="w-48 h-48 bg-gray-300 rounded-lg" />
        </div>

        <div className="flex justify-between mt-4">
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

  );
}
