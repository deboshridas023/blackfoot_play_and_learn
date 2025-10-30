import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import Login from "./pages/login";
import Home from "./pages/home";
import Flashcardthemes from "./games/flashcardthemes";
import Flashcards from "./games/flashcards";

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

  // once logged in show app with routes
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games/flashcardthemes" element={<Flashcardthemes />} />
        <Route path="/games/flashcards/:theme" element={<Flashcards />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
