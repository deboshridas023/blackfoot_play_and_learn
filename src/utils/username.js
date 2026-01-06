import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

// Keep usernames consistent for uniqueness checks
export function normalizeUsername(input) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "") // allow letters, numbers, _, .
    .replace(/^[_.]+/, "")
    .slice(0, 20);
}

export function validateUsername(raw) {
  const normalized = normalizeUsername(raw);

  if (!normalized) {
    return { ok: false, normalized, message: "Username is required." };
  }

  if (normalized.length < 3) {
    return { ok: false, normalized, message: "Use at least 3 characters." };
  }

  // must start with a letter/number
  if (!/^[a-z0-9]/.test(normalized)) {
    return { ok: false, normalized, message: "Username must start with a letter or number." };
  }

  // only allowed chars (already filtered), but keep explicit validation
  if (!/^[a-z0-9_.]+$/.test(normalized)) {
    return {
      ok: false,
      normalized,
      message: "Only letters, numbers, '_' and '.' are allowed.",
    };
  }

  return { ok: true, normalized, message: "" };
}

export async function isUsernameAvailable(db, normalizedUsername) {
  if (!normalizedUsername) return false;
  const ref = doc(db, "usernames", normalizedUsername);
  const snap = await getDoc(ref);
  return !snap.exists();
}

/**
 * Reserve a username uniquely and store it on the user's `users/{email}` doc.
 *
 * Schema:
 * - users/{email}: { username, usernameLower, ... }
 * - usernames/{usernameLower}: { email, uid, createdAt }
 */
export async function reserveUsernameForUser({ db, email, uid, username }) {
  const normalized = normalizeUsername(username);
  const verdict = validateUsername(normalized);
  if (!verdict.ok) {
    const err = new Error(verdict.message || "Invalid username.");
    err.code = "invalid-username";
    throw err;
  }

  const usernamesRef = doc(db, "usernames", verdict.normalized);
  const userRef = doc(db, "users", email);

  await runTransaction(db, async (tx) => {
    const usernameSnap = await tx.get(usernamesRef);
    if (usernameSnap.exists()) {
      const err = new Error("That username is already taken.");
      err.code = "username-taken";
      throw err;
    }

    const userSnap = await tx.get(userRef);
    const existing = userSnap.exists() ? userSnap.data() : {};

    // Create username index FIRST, then write user doc.
    tx.set(usernamesRef, {
      email,
      uid: uid || null,
      createdAt: serverTimestamp(),
    });

    tx.set(
      userRef,
      {
        ...existing,
        email,
        uid: uid || existing?.uid || null,
        username: verdict.normalized,
        usernameLower: verdict.normalized,
        updatedAt: serverTimestamp(),
        createdAt: existing?.createdAt || serverTimestamp(),
      },
      { merge: true }
    );
  });

  return verdict.normalized;
}

/**
 * Change username for an existing user.
 *
 * Guarantees uniqueness by:
 * - Creating new `usernames/{new}` index
 * - Deleting old `usernames/{old}` index (if any)
 * - Updating `users/{email}` doc
 */
export async function changeUsernameForUser({ db, email, uid, newUsername }) {
  const verdict = validateUsername(newUsername);
  if (!verdict.ok) {
    const err = new Error(verdict.message || "Invalid username.");
    err.code = "invalid-username";
    throw err;
  }

  const normalized = verdict.normalized;
  const userRef = doc(db, "users", email);
  const newIndexRef = doc(db, "usernames", normalized);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    const existing = userSnap.exists() ? userSnap.data() : {};
    const oldUsername = existing?.usernameLower || existing?.username || null;

    if (oldUsername && String(oldUsername).toLowerCase() === normalized) {
      // Nothing to change
      return;
    }

    // Ensure new username isn't taken
    const newIndexSnap = await tx.get(newIndexRef);
    if (newIndexSnap.exists()) {
      const err = new Error("That username is already taken.");
      err.code = "username-taken";
      throw err;
    }

    // Create new index
    tx.set(newIndexRef, {
      email,
      uid: uid || null,
      createdAt: serverTimestamp(),
    });

    // Update user profile
    tx.set(
      userRef,
      {
        email,
        uid: uid || existing?.uid || null,
        username: normalized,
        usernameLower: normalized,
        updatedAt: serverTimestamp(),
        createdAt: existing?.createdAt || serverTimestamp(),
      },
      { merge: true }
    );

    // Delete old index (if present)
    if (oldUsername) {
      const oldIndexRef = doc(db, "usernames", String(oldUsername).toLowerCase());
      tx.delete(oldIndexRef);
    }
  });

  return normalized;
}

/**
 * Deletes Firestore user profile docs for a given email.
 * (Auth user deletion must be handled separately.)
 */
export async function deleteUserProfileData({ db, email }) {
  const userRef = doc(db, "users", email);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) return;
    const data = userSnap.data() || {};
    const usernameLower = data?.usernameLower || data?.username || null;

    // remove username index first
    if (usernameLower) {
      tx.delete(doc(db, "usernames", String(usernameLower).toLowerCase()));
    }

    // remove user profile doc
    tx.delete(userRef);
  });
}
