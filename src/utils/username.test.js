import { normalizeUsername, validateUsername } from './username';

describe('username utilities', () => {
  test('normalizeUsername strips invalid chars and trims', () => {
    expect(normalizeUsername('  AbC-123!! ')).toBe('abc123');
    expect(normalizeUsername('..__badName__')).toBe('badname__');
  });

  test('validateUsername enforces rules', () => {
    expect(validateUsername('')).toEqual(expect.objectContaining({ ok: false }));
    expect(validateUsername('ab')).toEqual(expect.objectContaining({ ok: false }));
    expect(validateUsername('1abc')).toEqual(expect.objectContaining({ ok: true }));
    // special chars are stripped by normalization (abc$ -> abc) and then validated
    expect(validateUsername('abc$')).toEqual(expect.objectContaining({ ok: true }));
  });
});
