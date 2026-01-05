import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

import { db, storage } from "../firebase";
import Navbar from "../components/navbar";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import TopActions, { BackButton, ExitButton } from "../components/ui/TopActions";
import Button from "../components/ui/Button";
import { ChevronLeft, Home, RotateCcw, Volume2 } from "lucide-react";

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

  const capitalize = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1);  

  useEffect(() => {
    let cancelled = false;
    async function loadCards() {
      try {
        setLoading(true);
        const colRef = collection(db, `flashcards/dnvSyiAbhumktOGFUy3s/${theme}`);
        const snap = await getDocs(colRef);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (cancelled) return;

        setCards(data);
        setIndex(0);
        setFlipped(false);
        setCompleted(false);
      } catch (err) {
        console.error("Firestore error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCards();
    return () => (cancelled = true);
  }, [theme]);

  // Prevent layout shift / horizontal scrollbars during 3D flip animation
  useEffect(() => {
    const prevBodyOverflowX = document.body.style.overflowX;
    const prevBodyScrollbarGutter = document.body.style.scrollbarGutter;

    document.body.style.overflowX = "hidden";
    document.body.style.scrollbarGutter = "stable";

    return () => {
      document.body.style.overflowX = prevBodyOverflowX;
      document.body.style.scrollbarGutter = prevBodyScrollbarGutter;
    };
  }, []);

  // Stop audio on flip/index
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }, [flipped, index]);

  // Load the image for the current card
  useEffect(() => {
    let cancelled = false;

    async function loadImage() {
      try {
        const imgName = cards[index]?.image;
        if (!imgName) {
          setImage(null);
          return;
        }
        const imageRef = ref(storage, `blackfootimages/${imgName}`);
        const url = await getDownloadURL(imageRef);
        if (!cancelled) setImage(url);
      } catch (err) {
        console.error("Image fetch error:", err);
        if (!cancelled) setImage(null);
      }
    }

    loadImage();
    return () => {
      cancelled = true;
    };
  }, [index, cards]);

  const totalCards = cards.length;
  const coveredCards = Math.min(index + 1, totalCards);
  const progressPercent = totalCards ? Math.round((coveredCards / totalCards) * 100) : 0;

  const current = useMemo(() => cards[index], [cards, index]);

  const handleFlip = () => setFlipped((v) => !v);
  const handleNext = () => {
    if (index + 1 < cards.length) {
      setIndex((i) => i + 1);
      setFlipped(false);
    } else {
      setCompleted(true);
    }
  };
  const handlePrev = () => {
    if (index > 0) {
      setIndex((i) => i - 1);
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
      console.error("Audio playback error:", err);
    }
  }

  if (loading) {
    return (
      <Page className="flex items-center" containerClassName="py-16" variant="paper">
        <div className="w-full max-w-xl mx-auto text-center text-[var(--muted)]">
          Loading cards…
        </div>
      </Page>
    );
  }

  if (!cards.length) {
    return (
      <Page containerClassName="py-16" variant="paper">
        <Navbar />
        <div className="mx-auto max-w-2xl pt-10">
          <Card className="p-6 text-center">
            <div className="text-sm text-[var(--muted)]">No flashcards found for:</div>
            <div className="mt-1 text-lg font-semibold text-[var(--text)]">
              {theme}
            </div>
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => navigate("/games/flashcardthemes")}
                variant="secondary"
                leftIcon={ChevronLeft}
              >
                Back to Themes
              </Button>
            </div>
          </Card>
        </div>
      </Page>
    );
  }

  if (completed) {
    return (
      <Page className="flex items-center" containerClassName="py-16" variant="paper">
        <Navbar />
        <div className="w-full max-w-xl mx-auto pt-10">
          <Card className="p-6 sm:p-8 text-center">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Flashcards
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-[var(--text)]">
              Theme completed
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              You finished <span className="font-medium text-[var(--text)]">{theme}</span>.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={restart} leftIcon={RotateCcw}>
                Restart
              </Button>
              <Button
                onClick={() => navigate("/games/flashcardthemes")}
                variant="secondary"
                leftIcon={ChevronLeft}
              >
                Back to Themes
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="secondary"
                leftIcon={Home}
              >
                Home
              </Button>
            </div>
          </Card>
        </div>
      </Page>
    );
  }

  return (
    <Page className="overflow-x-hidden" variant="paper">
      <Navbar />

      <div className="pt-8">
        <header>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Flashcards
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
            {capitalize(theme)}
          </h1>

          <TopActions
            left={
              <BackButton
                onClick={() => navigate("/games/flashcardthemes")}
                icon={ChevronLeft}
              >
                Back to Themes
              </BackButton>
            }
            right={<ExitButton onClick={() => navigate("/")} icon={Home} />}
          />
        </header>

        {/* Progress */}
        <div className="mt-6 w-full">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-1">
            <span>Progress</span>
            <span>
              {coveredCards}/{totalCards} ({progressPercent}%)
            </span>
          </div>
          <div
            className="h-2 w-full rounded-full bg-amber-50/70 overflow-hidden border border-[var(--border)]"
            role="progressbar"
            aria-label="Flashcards progress"
            aria-valuenow={coveredCards}
            aria-valuemin={0}
            aria-valuemax={totalCards}
          >
            <div
              className="h-full bg-[var(--gold)] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center pb-12">
          <div className="relative w-[320px] h-[460px] sm:w-[380px] sm:h-[500px] perspective overflow-hidden">
            <div
              className={`relative w-full h-full duration-500 transform-style-preserve-3d ${
                flipped ? "rotate-y-180" : ""
              }`}
            >
              {/* FRONT */}
              <Card
                onClick={handleFlip}
                className="absolute w-full h-full p-6 backface-hidden flex flex-col items-center justify-center gap-6 cursor-pointer border border-rose-200/70"
              >
                <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)] text-center">
                  {current?.english}
                </p>
                <p className="text-sm text-[var(--muted)]">Tap to flip</p>
              </Card>

              {/* BACK */}
              <Card className="absolute w-full h-full p-6 backface-hidden flex flex-col justify-between rotate-y-180 border border-rose-200/70">
                <div className="text-xl sm:text-2xl font-semibold text-center mt-2 text-[var(--text)]">
                  {current?.blackfoot}
                </div>

                <div className="flex flex-col items-center justify-center gap-2 text-[var(--text)]">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Audio
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    {current?.audio || "No audio file"}
                  </div>
                  {current?.audio && (
                    <Button onClick={playAudio} leftIcon={Volume2}>
                      Play audio
                    </Button>
                  )}
                </div>

                <div className="flex justify-center mt-3">
                  {image ? (
                    <img
                      src={image}
                      alt={current?.english}
                      className="w-44 h-44 object-cover rounded-xl border border-[var(--border)]"
                    />
                  ) : (
                    <div className="w-44 h-44 bg-white/50 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--muted)] text-sm">
                      No image
                    </div>
                  )}
                </div>

                <div className="flex justify-between gap-3 mt-4">
                  <Button
                    onClick={handlePrev}
                    variant="secondary"
                    disabled={index === 0}
                  >
                    Prev
                  </Button>
                  <Button onClick={handleNext}>Next</Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
