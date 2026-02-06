// jest manual mock for firebase modules used by the app
const mockAuth = {
  currentUser: { email: 'test@example.com', uid: 'uid-123' },
  onAuthStateChanged(cb) {
    // call immediately with current user, return unsubscribe
    try {
      cb(this.currentUser);
    } catch (e) {
      // ignore
    }
    return () => {};
  },
};

// also expose a helper to simulate auth state change in tests
mockAuth.__setUser = function (user) {
  this.currentUser = user;
};

const mockDb = {};

const mockStorage = {};

module.exports = {
  auth: mockAuth,
  db: mockDb,
  storage: mockStorage,
};
