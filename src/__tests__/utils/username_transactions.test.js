import { reserveUsernameForUser, changeUsernameForUser, deleteUserProfileData, isUsernameAvailable, validateUsername, normalizeUsername } from '../../utils/username';

// Mock firestore transaction functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((...args) => ({ path: args.join('/') })),
  getDoc: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => 'MOCK_TIMESTAMP'),
}));

describe('username transactional helpers (mocked runTransaction)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('normalizeUsername behavior', () => {
    expect(normalizeUsername('  AbC-123!! ')).toBe('abc123');
    expect(normalizeUsername('..__badName__')).toBe('badname__');
    expect(normalizeUsername(null)).toBe('');
  });

  test('validateUsername cases', () => {
    expect(validateUsername('').ok).toBe(false);
    expect(validateUsername('ab').ok).toBe(false);
    // '_abc' becomes 'abc' after normalization, which is valid
    expect(validateUsername('_abc').ok).toBe(true);
    expect(validateUsername('abc').ok).toBe(true);
  });

  test('isUsernameAvailable behavior', async () => {
    const { getDoc } = require('firebase/firestore');
    getDoc.mockResolvedValueOnce({ exists: () => true });
    expect(await isUsernameAvailable({}, 'taken')).toBe(false);

    getDoc.mockResolvedValueOnce({ exists: () => false });
    expect(await isUsernameAvailable({}, 'free')).toBe(true);

    expect(await isUsernameAvailable({}, '')).toBe(false);
  });

  test('reserveUsernameForUser success path', async () => {
    const { runTransaction } = require('firebase/firestore');
    const mockTx = {
      get: jest.fn()
        .mockResolvedValueOnce({ exists: () => false }) // username index
        .mockResolvedValueOnce({ exists: () => false }), // user profile
      set: jest.fn(),
    };
    runTransaction.mockImplementation(async (db, fn) => await fn(mockTx));

    const res = await reserveUsernameForUser({ db: {}, email: 'test@e.com', uid: 'u1', username: 'bob' });
    expect(res).toBe('bob');
    expect(mockTx.set).toHaveBeenCalledTimes(2);
  });

  test('reserveUsernameForUser throws on invalid username', async () => {
    await expect(reserveUsernameForUser({ db: {}, email: 'e', username: 'ab' })).rejects.toHaveProperty('code', 'invalid-username');
  });

  test('reserveUsernameForUser throws if taken', async () => {
    const { runTransaction } = require('firebase/firestore');
    const mockTx = {
      get: jest.fn().mockResolvedValueOnce({ exists: () => true }),
    };
    runTransaction.mockImplementation(async (db, fn) => await fn(mockTx));

    await expect(reserveUsernameForUser({ db: {}, email: 'e', username: 'bob' })).rejects.toHaveProperty('code', 'username-taken');
  });

  test('changeUsernameForUser success path', async () => {
    const { runTransaction } = require('firebase/firestore');
    const mockTx = {
      get: jest.fn()
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ usernameLower: 'old' }) }) // current profile
        .mockResolvedValueOnce({ exists: () => false }), // new username index
      set: jest.fn(),
      delete: jest.fn(),
    };
    runTransaction.mockImplementation(async (db, fn) => await fn(mockTx));

    const res = await changeUsernameForUser({ db: {}, email: 'e', newUsername: 'new' });
    expect(res).toBe('new');
    expect(mockTx.delete).toHaveBeenCalled();
    expect(mockTx.set).toHaveBeenCalledTimes(2);
  });

  test('changeUsernameForUser noop if same', async () => {
    const { runTransaction } = require('firebase/firestore');
    const mockTx = {
      get: jest.fn().mockResolvedValueOnce({ exists: () => true, data: () => ({ usernameLower: 'same' }) }),
      set: jest.fn(),
    };
    runTransaction.mockImplementation(async (db, fn) => await fn(mockTx));

    const res = await changeUsernameForUser({ db: {}, email: 'e', newUsername: 'same' });
    expect(res).toBe('same');
    expect(mockTx.set).not.toHaveBeenCalled();
  });

  test('changeUsernameForUser throws if taken', async () => {
    const { runTransaction } = require('firebase/firestore');
    const mockTx = {
      get: jest.fn()
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ usernameLower: 'old' }) })
        .mockResolvedValueOnce({ exists: () => true }),
    };
    runTransaction.mockImplementation(async (db, fn) => await fn(mockTx));

    await expect(changeUsernameForUser({ db: {}, email: 'e', newUsername: 'taken' })).rejects.toHaveProperty('code', 'username-taken');
  });

  test('deleteUserProfileData success paths', async () => {
    const { runTransaction } = require('firebase/firestore');
    const mockTx = {
      get: jest.fn()
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ usernameLower: 'bob' }) })
        .mockResolvedValueOnce({ exists: () => false }), // for the second call
      delete: jest.fn(),
    };
    runTransaction.mockImplementation(async (db, fn) => await fn(mockTx));

    // with username
    await deleteUserProfileData({ db: {}, email: 'e1' });
    expect(mockTx.delete).toHaveBeenCalledTimes(2);

    // without profile
    await deleteUserProfileData({ db: {}, email: 'e2' });
    expect(mockTx.delete).toHaveBeenCalledTimes(2); // no new calls
  });
});
