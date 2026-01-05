// src/pages/ShortStoryDetail.jsx

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage, auth } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import Navbar from "../components/navbar";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import TopActions, { BackButton, ExitButton } from "../components/ui/TopActions";
import Button from "../components/ui/Button";
import { ChevronLeft, Home, Volume2, CheckCircle2, XCircle } from "lucide-react";

export default function ShortStoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  // dialect game state
  const [selectedDialect, setSelectedDialect] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null); // true / false / null
  const [score, setScore] = useState(0); // session score for this story
  const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false); // prevent double scoring

  // 1) Load story data
  useEffect(() => {
    let cancelled = false;
    const audioEl = audioRef.current;

    async function loadStory() {
      try {
        setLoading(true);
        const docRef = doc(db, "shortStories", id);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          console.warn("Story not found:", id);
          if (!cancelled) setStory(null);
        } else if (!cancelled) {
          const data = snap.data();
          setStory({ id: snap.id, ...data });

          // reset game state whenever the story changes
          setSelectedDialect(null);
          setIsCorrect(null);
          setScore(0);
          setHasAnsweredCorrectly(false);
        }
      } catch (err) {
        console.error("Error fetching story:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStory();

    return () => {
      cancelled = true;

      // cleanup audio element safely
      if (audioEl) {
        audioEl.pause();
        audioEl.src = "";
      }
    };
  }, [id]);

  // 2) Once story + audioRef exist, load the audio URL into the <audio> element
  useEffect(() => {
    if (!story?.blackfootaudio) return;
    if (!audioRef.current) return;

    let cancelled = false;

    async function loadAudio() {
      try {
        const audioPathRef = ref(
          storage,
          `blackfootaudios/${story.blackfootaudio}`
        );
        const url = await getDownloadURL(audioPathRef);
        if (!cancelled && audioRef.current) {
          audioRef.current.src = url;
        }
      } catch (err) {
        console.error("Error loading audio URL:", err);
      }
    }

    loadAudio();

    return () => {
      cancelled = true;
    };
  }, [story?.blackfootaudio]);

  // add +1 point for the current user (identified by email)
  async function addPointForUser() {
    const user = auth.currentUser;
    if (!user || !user.email) return;

    const email = user.email; // use email as document ID
    const userDocRef = doc(db, "users", email);

    try {
      const snap = await getDoc(userDocRef);

      if (!snap.exists()) {
        // first time: create document with initial score
        await setDoc(userDocRef, {
          shortStoriesScore: 1,
          createdAt: new Date(),
        });
      } else {
        // increment existing score
        await updateDoc(userDocRef, {
          shortStoriesScore: increment(1),
        });
      }
    } catch (err) {
      console.error("Error updating user score:", err);
    }
  }

  // handle dialect option click
  async function handleDialectClick(option) {
    if (!story) return;

    setSelectedDialect(option);

    const correct = option === story.correctDialect;
    setIsCorrect(correct);

    // only score the first time they get it right in this visit
    if (correct && !hasAnsweredCorrectly) {
      setScore((prev) => prev + 1);
      setHasAnsweredCorrectly(true);
      await addPointForUser();
    }
  }

  if (loading) {
    return (
      <Page className="flex items-center" containerClassName="py-16" variant="paper">
        <div className="w-full max-w-xl mx-auto text-center text-[var(--muted)]">
          Loading story…
        </div>
      </Page>
    );
  }

  if (!story) {
    return (
      <Page containerClassName="py-10" variant="paper">
        <Navbar />
        <div className="pt-10">
          <Card className="p-6 text-center">
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text)]">
              Story not found
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              This story may have been removed or is unavailable.
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => navigate("/games/shortstorieslist")}
                variant="secondary"
                leftIcon={ChevronLeft}
              >
                Back to Stories
              </Button>
            </div>
          </Card>
        </div>
      </Page>
    );
  }

  return (
    <Page variant="paper">
      <Navbar />

      <div className="pt-8">
        <header>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Voices of the Blackfoot
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text)]">
            {story.englishtitle}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{story.blackfoottitle}</p>

          <TopActions
            left={
              <BackButton
                onClick={() => navigate("/games/shortstorieslist")}
                icon={ChevronLeft}
              >
                Back to Stories
              </BackButton>
            }
            right={<ExitButton onClick={() => navigate("/")} icon={Home} />}
          />
        </header>

        <div className="mt-8 pb-12 grid gap-6">
          {/* Audio + translation */}
          <Card className="p-6 border border-rose-200/70">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Audio
            </div>
            <div className="mt-3">
              <audio ref={audioRef} controls className="w-full max-w-md">
                Your browser does not support the audio element.
              </audio>
            </div>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                English translation
              </div>
              <p className="mt-2 text-sm text-[var(--text)] whitespace-pre-line leading-relaxed">
                {story.englishtranslation}
              </p>
            </div>
          </Card>

          {/* Dialect guessing game */}
          {story.dialectOptions && story.dialectOptions.length > 0 && (
            <Card className="p-6 border border-rose-200/70">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Game
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--text)]">
                    Guess the dialect
                  </h2>
                </div>

                <div className="text-xs text-[var(--muted)]">
                  Score (this story): <span className="font-semibold text-[var(--text)]">{score}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {story.dialectOptions.map((option) => {
                  const isSelected = selectedDialect === option;
                  const correctSelected = isSelected && isCorrect === true;
                  const wrongSelected = isSelected && isCorrect === false;

                  return (
                    <Button
                      key={option}
                      onClick={() => handleDialectClick(option)}
                      variant={correctSelected ? "primary" : "secondary"}
                      className={
                        "justify-start w-full " +
                        (wrongSelected
                          ? "border-rose-400 bg-rose-50/70"
                          : correctSelected
                            ? "bg-emerald-700 hover:bg-emerald-800"
                            : "")
                      }
                      leftIcon={
                        correctSelected
                          ? CheckCircle2
                          : wrongSelected
                            ? XCircle
                            : Volume2
                      }
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>

              {isCorrect !== null && (
                <div className="mt-4 text-sm">
                  {isCorrect ? (
                    <div className="text-emerald-700">Correct — +1 point.</div>
                  ) : (
                    <div className="text-rose-700">Not quite. Try again.</div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}
