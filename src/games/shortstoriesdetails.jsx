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
      const audioEl = audioRef.current;
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
      <div className="min-h-screen flex items-center justify-center bg-[#f8f1ec] text-[#6b2020]">
        <p>Loading story...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-[#f8f1ec] text-[#6b2020]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-serif mb-4">Story not found</h1>
          <button
            onClick={() => navigate("/games/shortstorieslist")}
            className="mt-6 px-4 py-2 bg-[#c54b4b] text-[#fffaf8] rounded hover:bg-[#a63e3e] transition-all duration-200"
          >
            Back to Stories
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

      {/* ⭐ Unified button bar - same as Flashcards */}
      <div className="flex justify-between px-6 mt-4">
        <button
          onClick={() => navigate("/games/shortstorieslist")}
          className="px-4 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f] transition-all duration-200"
        >
          ← Back to Stories
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-[#d4af37] text-black rounded hover:bg-[#c09b2f] transition-all duration-200"
        >
          Exit & Return Home
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* English title */}
        <h1 className="text-3xl font-serif text-[#a12222] mb-2">
          {story.englishtitle}
        </h1>

        {/* Blackfoot title */}
        <h2 className="text-xl text-[#6b2020]/90 italic mb-4">
          {story.blackfoottitle}
        </h2>

        {/* Description (optional) */}
        {story.description && (
          <p className="mb-6 text-sm text-[#5a1b1b] leading-relaxed">
            {story.description}
          </p>
        )}

        {/* Audio + translation card */}
        <div className="bg-[#fff4f4] border border-[#e3a4a4] rounded-xl p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            {/* Native audio control ONLY */}
            <audio ref={audioRef} controls className="w-full max-w-md">
              Your browser does not support the audio element.
            </audio>

            {/* English translation */}
            <div className="mt-4">
              <h3 className="font-semibold text-[#a12222] mb-1">
                English Translation
              </h3>
              <p className="text-sm leading-relaxed text-[#5a1b1b] whitespace-pre-line">
                {story.englishtranslation}
              </p>
            </div>
          </div>
        </div>

        {/* Dialect guessing game */}
        {story.dialectOptions && story.dialectOptions.length > 0 && (
          <div className="mt-8 bg-[#fff4f4] border border-[#e3a4a4] rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-[#a12222] mb-3">
              Guess the dialect of this story
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              {story.dialectOptions.map((option) => {
                const isSelected = selectedDialect === option;

                let extraClasses = "";
                if (isSelected && isCorrect === true) {
                  extraClasses = "border-green-600 bg-green-50";
                } else if (isSelected && isCorrect === false) {
                  extraClasses = "border-red-600 bg-red-50";
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleDialectClick(option)}
                    className={`w-full px-4 py-2 text-left border rounded-lg text-sm
                                hover:border-[#d4af37] hover:bg-[#fff7e0] transition
                                ${extraClasses}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {isCorrect !== null && (
              <p className="mt-3 text-sm">
                {isCorrect ? (
                  <span className="text-green-700">
                    ✅ Correct! You earned 1 point.
                  </span>
                ) : (
                  <span className="text-red-700">
                    ❌ Not quite. Try again!
                  </span>
                )}
              </p>
            )}

            {/* Optional: session score display */}
            <p className="mt-2 text-xs text-[#6b2020]/70">
              Score (this story): {score}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
