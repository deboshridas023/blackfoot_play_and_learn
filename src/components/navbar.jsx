import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signOut,
} from "firebase/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, googleProvider } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  AtSign,
  GraduationCap,
  LogOut,
  Save,
  ShieldAlert,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Button from "./ui/Button";
import {
  changeUsernameForUser,
  deleteUserProfileData,
  isUsernameAvailable,
  normalizeUsername,
  validateUsername,
} from "../utils/username";

function providerIds(user) {
  return (user?.providerData || []).map((p) => p.providerId).filter(Boolean);
}

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [username, setUsername] = useState(() => {
    if (auth.currentUser?.email) {
      return localStorage.getItem(`bf_username_${auth.currentUser.email}`) || undefined;
    }
    return undefined;
  });

  const [profileOpen, setProfileOpen] = useState(false);
  const profileBtnRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Username edit state
  const [rawUsername, setRawUsername] = useState("");
  const normalizedUsername = useMemo(
    () => normalizeUsername(rawUsername),
    [rawUsername]
  );
  const usernameValidation = useMemo(
    () => validateUsername(rawUsername),
    [rawUsername]
  );
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null); // null | boolean
  const [savingUsername, setSavingUsername] = useState(false);

  // Delete account state
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");

  // Shared UI messages
  const [profileError, setProfileError] = useState("");
  const [profileInfo, setProfileInfo] = useState("");

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  // Close on outside click / escape
  useEffect(() => {
    if (!profileOpen) return;

    function onDocMouseDown(e) {
      const btn = profileBtnRef.current;
      const menu = profileMenuRef.current;
      const t = e.target;
      if (btn && btn.contains(t)) return;
      if (menu && menu.contains(t)) return;
      setProfileOpen(false);
    }

    function onKeyDown(e) {
      if (e.key === "Escape") setProfileOpen(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const email = user?.email;
      if (!email) {
        if (!cancelled) setUsername(null);
        return;
      }
      
      const cached = localStorage.getItem(`bf_username_${email}`);
      if (cached && !cancelled) {
        setUsername(cached);
      }

      try {
        const snap = await getDoc(doc(db, "users", email));
        if (!cancelled) {
          const fetchedName = snap.exists() ? snap.data()?.username || null : null;
          setUsername(fetchedName);
          if (fetchedName) {
            localStorage.setItem(`bf_username_${email}`, fetchedName);
          } else {
            localStorage.removeItem(`bf_username_${email}`);
          }
        }
      } catch {
        if (!cancelled && !cached) setUsername(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  // Initialize menu state when opening
  useEffect(() => {
    if (!profileOpen) return;
    setRawUsername(username || "");
    setCheckingUsername(false);
    setUsernameAvailable(null);
    setSavingUsername(false);
    setConfirmDelete("");
    setDeleting(false);
    setReauthPassword("");
    setProfileError("");
    setProfileInfo("");
  }, [profileOpen, username]);

  // Availability check with small debounce
  useEffect(() => {
    let cancelled = false;

    if (!profileOpen) return;

    const currentLower = String(username || "").toLowerCase();
    const sameAsCurrent = !!currentLower && currentLower === usernameValidation.normalized;

    if (!rawUsername.trim()) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    if (!usernameValidation.ok) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    if (sameAsCurrent) {
      setUsernameAvailable(true);
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    setUsernameAvailable(null);

    const t = setTimeout(async () => {
      try {
        const ok = await isUsernameAvailable(db, usernameValidation.normalized);
        if (!cancelled) setUsernameAvailable(ok);
      } catch {
        if (!cancelled) setUsernameAvailable(null);
      } finally {
        if (!cancelled) setCheckingUsername(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    profileOpen,
    rawUsername,
    username,
    usernameValidation.normalized,
    usernameValidation.ok,
  ]);

  const accountEmail = useMemo(() => {
    // Prefer a real email, but fall back to a friendly label for providers/accounts
    // that may not have one.
    if (!user) return "";
    return user.email || user.providerData?.find((p) => p.email)?.email || "Signed in";
  }, [user]);

  const accountLabel = useMemo(() => {
    if (username === undefined) return "";
    return username || accountEmail;
  }, [accountEmail, username]);

  const handleExit = async () => {
    await signOut(auth);
    navigate("/");
  };

  const canSaveUsername = useMemo(() => {
    if (!user?.email) return false;
    if (savingUsername || checkingUsername) return false;
    if (!usernameValidation.ok) return false;
    if (usernameAvailable !== true) return false;

    const currentLower = String(username || "").toLowerCase();
    if (currentLower && currentLower === usernameValidation.normalized) return false;
    return true;
  }, [
    checkingUsername,
    savingUsername,
    user?.email,
    username,
    usernameAvailable,
    usernameValidation.normalized,
    usernameValidation.ok,
  ]);

  const handleSaveUsername = async () => {
    setProfileError("");
    setProfileInfo("");

    const u = auth.currentUser;
    if (!u?.email) {
      setProfileError("You must be signed in to change your username.");
      return;
    }

    if (!usernameValidation.ok) {
      setProfileError(usernameValidation.message || "Invalid username.");
      return;
    }

    setSavingUsername(true);
    try {
      const updated = await changeUsernameForUser({
        db,
        email: u.email,
        uid: u.uid,
        newUsername: rawUsername,
      });
      setUsername(updated);
      localStorage.setItem(`bf_username_${u.email}`, updated);
      setProfileInfo("Username updated.");
    } catch (err) {
      setProfileError(err?.message || "Failed to update username.");
    } finally {
      setSavingUsername(false);
    }
  };

  async function reauthIfNeeded() {
    const u = auth.currentUser;
    const ids = providerIds(u);
    const isPassword = ids.includes("password");
    const isGoogle = ids.includes("google.com");

    // Prefer Google re-auth if available (avoids asking for a password
    // when the user signed in via Google).
    if (isGoogle) {
      await reauthenticateWithPopup(u, googleProvider);
      return;
    }

    if (isPassword) {
      if (!u?.email) throw new Error("Missing email for re-authentication.");
      if (!reauthPassword) {
        const err = new Error("Enter your password to continue.");
        err.code = "missing-password";
        throw err;
      }
      const cred = EmailAuthProvider.credential(u.email, reauthPassword);
      await reauthenticateWithCredential(u, cred);
      return;
    }

    // fallback: user must sign in again
    const err = new Error("Please sign in again to continue.");
    err.code = "reauth-unsupported";
    throw err;
  }

  const handleDeleteAccount = async () => {
    // For safety/consistency, always re-authenticate before deleting
    // so we don't end up deleting Firestore data but failing Auth deletion.
    setProfileError("");
    setProfileInfo("");

    if (confirmDelete.trim().toUpperCase() !== "DELETE") {
      setProfileError('Type "DELETE" to confirm account deletion.');
      return;
    }

    await handleReauthAndDelete();
  };

  const handleReauthAndDelete = async () => {
    setProfileError("");
    setProfileInfo("");
    setDeleting(true);
    try {
      await reauthIfNeeded();
      const u = auth.currentUser;
      if (!u) throw new Error("No signed-in user.");

      if (!u.email) throw new Error("Missing email for account deletion.");

      // Delete Firestore profile + username index while still authenticated
      await deleteUserProfileData({ db, email: u.email });

      // Delete Auth user
      const deletedEmail = u.email;
      await deleteUser(u);
      localStorage.removeItem(`bf_username_${deletedEmail}`);
      navigate("/");
    } catch (err) {
      setProfileError(err?.message || "Re-authentication failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <nav className="relative z-40 w-full bg-[var(--brand-2)] text-white/95 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-wrap gap-3 justify-between items-center">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <div className="text-xs uppercase tracking-[0.18em] text-white/70">
              Blackfoot
            </div>
            <div className="text-lg sm:text-xl font-semibold tracking-tight">
              Play & Learn
            </div>
          </div>
        </div>

        {/* Account + Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 text-right leading-tight max-w-[320px]">
            <UserRound className="h-4 w-4 text-white/70" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-white/70">
                Account
              </div>
              <div className="text-sm font-medium truncate" title={accountEmail}>
                {accountLabel}
              </div>
            </div>
          </div>

          {/* Profile (username + delete account) */}
          <div className="relative">
            <button
              ref={profileBtnRef}
              type="button"
              onClick={() => setProfileOpen((s) => !s)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/15 transition"
              aria-haspopup="dialog"
              aria-expanded={profileOpen ? "true" : "false"}
              aria-label="Profile settings"
              title="Profile"
            >
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </button>

            {profileOpen && (
              <div
                ref={profileMenuRef}
                className="absolute right-0 mt-2 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border border-white/20 bg-white shadow-lg shadow-black/10 overflow-hidden"
                role="dialog"
                aria-label="Profile settings"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-amber-50/60 border-b border-[var(--border)]">
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-[var(--muted)]">
                      Profile
                    </div>
                    <div className="text-sm font-semibold text-[var(--text)] truncate" title={accountEmail}>
                      {accountEmail}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileOpen(false)}
                    className="rounded-md p-1.5 text-[var(--muted)] hover:bg-black/5"
                    aria-label="Close profile"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="px-4 py-4 text-[var(--text)]">
                  {profileError && (
                    <div className="mb-3 rounded-lg border border-rose-300 bg-rose-50/70 px-3 py-2 text-sm text-rose-700">
                      {profileError}
                    </div>
                  )}
                  {profileInfo && (
                    <div className="mb-3 rounded-lg border border-amber-300/60 bg-amber-50/60 px-3 py-2 text-sm text-[var(--text)]">
                      {profileInfo}
                    </div>
                  )}

                  {/* Username */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">Username</div>
                      <div className="text-xs text-[var(--muted)]">
                        Current: <span className="font-medium">{username || "—"}</span>
                      </div>
                    </div>

                    <label className="mt-3 block text-xs font-medium text-[var(--muted)]">
                      New username
                    </label>
                    <input
                      type="text"
                      value={rawUsername}
                      onChange={(e) => setRawUsername(e.target.value)}
                      placeholder="e.g. firstname_lastname"
                      autoComplete="off"
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    />

                    <div className="mt-2 flex items-start justify-between gap-3">
                      <div className="text-xs text-[var(--muted)]">
                        Saved as: <span className="font-medium">{normalizedUsername || "—"}</span>
                      </div>
                      <div className="text-xs text-[var(--muted)] inline-flex items-center gap-1">
                        <AtSign className="h-3.5 w-3.5" aria-hidden="true" />
                        Unique
                      </div>
                    </div>

                    <div className="mt-2 text-sm">
                      {!rawUsername.trim() ? null : !usernameValidation.ok ? (
                        <div className="text-rose-700">{usernameValidation.message}</div>
                      ) : checkingUsername ? (
                        <div className="text-[var(--muted)]">Checking availability…</div>
                      ) : usernameAvailable === false ? (
                        <div className="text-rose-700">That username is taken.</div>
                      ) : usernameAvailable === true ? (
                        <div className="text-emerald-700">Username available.</div>
                      ) : null}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        type="button"
                        onClick={handleSaveUsername}
                        disabled={!canSaveUsername}
                        leftIcon={Save}
                        className="w-full"
                      >
                        {savingUsername ? "Saving…" : "Save username"}
                      </Button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-5 h-px bg-[var(--border)]" />

                  {/* Danger zone */}
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <ShieldAlert className="h-4 w-4 text-rose-700" aria-hidden="true" />
                      Delete account
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
                      This permanently removes your account and leaderboard scores. This cannot be undone.
                    </p>

                    <label className="mt-3 block text-xs font-medium text-[var(--muted)]">
                      Type <span className="font-semibold">DELETE</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      placeholder="DELETE"
                    />

                    {providerIds(user).includes("google.com") ? (
                      <div className="mt-3 text-xs text-[var(--muted)]">
                        You’ll be prompted by Google to confirm this action.
                      </div>
                    ) : providerIds(user).includes("password") ? (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-[var(--muted)]">
                          Password (required)
                        </label>
                        <input
                          type="password"
                          value={reauthPassword}
                          onChange={(e) => setReauthPassword(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                          placeholder="••••••••"
                          autoComplete="current-password"
                        />
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-[var(--muted)]">
                        You may need to sign in again to delete your account.
                      </div>
                    )}

                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="danger"
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        leftIcon={Trash2}
                        className="w-full"
                      >
                        {deleting ? "Deleting…" : "Delete account"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleExit}
            variant="ghost"
            size="sm"
            leftIcon={LogOut}
            className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
          >
            Logout
          </Button>
        </div>

      </div>
    </nav>
  );
}
