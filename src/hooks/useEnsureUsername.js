import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Redirects logged-in users to `/choose-username` if their `users/{email}` doc
 * is missing `username`.
 */
export default function useEnsureUsername() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setChecking(true);

        const user = auth.currentUser;
        const email = user?.email;
        if (!email) {
          if (!cancelled) setChecking(false);
          return;
        }

        // Don't redirect if they are already on the chooser page
        if (location.pathname === "/choose-username") {
          if (!cancelled) setChecking(false);
          return;
        }

        const snap = await getDoc(doc(db, "users", email));
        const username = snap.exists() ? snap.data()?.username : null;
        if (!cancelled && !username) {
          navigate("/choose-username", { replace: true });
          return;
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  return { checking };
}

