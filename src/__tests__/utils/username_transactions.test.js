import { reserveUsernameForUser, changeUsernameForUser, deleteUserProfileData } from '../../utils/username';

// Mock firestore transaction functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _seconds: 1 })),
}));

describe('username transactional helpers (mocked runTransaction)', () => {
  beforeEach(() => jest.resetAllMocks());

  test('reserveUsernameForUser throws on invalid username', async () => {
    await expect(reserveUsernameForUser({ db: {}, email: 'e', username: 'ab' })).rejects.toHaveProperty('code', 'invalid-username');
  });

  test('changeUsernameForUser throws on invalid username', async () => {
    await expect(changeUsernameForUser({ db: {}, email: 'e', newUsername: 'a' })).rejects.toHaveProperty('code', 'invalid-username');
  });

  test('deleteUserProfileData calls runTransaction', async () => {
    const { runTransaction } = require('firebase/firestore');
    runTransaction.mockImplementation(async (db, fn) => { await fn({ get: async () => ({ exists: () => false }) }); });

    await expect(deleteUserProfileData({ db: {}, email: 'e' })).resolves.toBeUndefined();
    expect(runTransaction).toHaveBeenCalled();
  });
});
