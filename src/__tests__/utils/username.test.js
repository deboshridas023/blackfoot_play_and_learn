// Mock the firestore module at top-level so the util imports the mocked functions
jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  doc: jest.fn(),
}));

describe('username firestore helpers (mocked tx)', () => {
  test('normalize + validate behavior', () => {
    // Import module normally for pure functions
    const { normalizeUsername, validateUsername } = require('../../utils/username');
    expect(normalizeUsername('AbC!!')).toBe('abc');
    expect(validateUsername('ab')).toEqual(expect.objectContaining({ ok: false }));
  });

  test('isUsernameAvailable uses getDoc', async () => {
    const mockDb = {};
    const firestore = require('firebase/firestore');
    firestore.getDoc.mockImplementation(async (ref) => ({ exists: () => false }));

    // Require the util after the mock is in place
    const { isUsernameAvailable } = require('../../utils/username');

    const res = await isUsernameAvailable(mockDb, 'bob');
    expect(res).toBe(true);
  });
});
