import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import Login from "./pages/login";
import VerifyEmail from "./pages/verifyEmail";
import Home from "./pages/home";
import Flashcardthemes from "./games/flashcardthemes";
import Flashcards from "./games/flashcards";
import FillInTheGap from "./games/fillinthegap";
import History from "./pages/history";
import ShortStoriesList from "./games/shortstorieslist"
import ShortStoryDetail from "./games/shortstoriesdetails"
import Quiz from "./games/quiz"
import Leaderboard from "./pages/leaderboard";
import FillInTheGapThemes from "./games/fillinthegapThemes"


function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  // still loading auth state
  if (user === undefined) return null;

  // if not logged in show login page
  if (!user) return <Login />;

  // Require verification for email/password accounts before allowing access.
  const isPasswordUser = user.providerData?.some((p) => p.providerId === "password");
  if (isPasswordUser && !user.emailVerified) return <VerifyEmail />;

  // once logged in show app with routes
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games/flashcardthemes" element={<Flashcardthemes />} />
        <Route path="/games/flashcards/:theme" element={<Flashcards />} />
        <Route path="/games/fillinthegap" element={<FillInTheGap />} />
        <Route path="/games/fillinthegapthemes" element={<FillInTheGapThemes />} />
        <Route path="/games/shortstorieslist" element={<ShortStoriesList />} />
        <Route path="/games/shortstoriesdetails/:id" element={<ShortStoryDetail />} />
        <Route path="/games/quiz" element={<Quiz />} />
        <Route path="/history" element={<History />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
