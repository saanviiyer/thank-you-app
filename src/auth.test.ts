import { describe, expect, it } from 'vitest';
import { createAccount, currentProfile, initials, normalizeUsername, parseAuth, signIn, strongPassword, validEmail, validUsername } from './auth';

describe('account validation', () => {
  it('normalizes only leading at signs', () => { expect(normalizeUsername('  @@Saanvi.I ')).toBe('saanvi.i'); });
  it('validates account fields', () => {
    expect(validUsername('saanvi.i')).toBe(true); expect(validUsername('ab')).toBe(false);
    expect(validEmail('hello@example.com')).toBe(true); expect(validEmail('hello@example')).toBe(false);
    expect(strongPassword('kindness7')).toBe(true); expect(strongPassword('kindness')).toBe(false);
  });
  it('creates stable initials and rejects corrupt auth data', () => {
    expect(initials('Saanvi Iyer')).toBe('SI'); expect(parseAuth('{"bad":true}').accounts).toEqual([]);
  });

  it('creates PBKDF2 credentials and signs in without storing the password', async () => {
    const created = await createAccount({ version: 1, accounts: [] }, { name: 'Saanvi Iyer', username: 'saanvi', email: 'saanvi@example.com', password: 'kindness7' });
    expect(created.data).toBeDefined();
    expect(JSON.stringify(created.data)).not.toContain('kindness7');
    const signedOut = { ...created.data!, sessionId: undefined };
    const signedIn = await signIn(signedOut, 'SAANVI@example.com', 'kindness7');
    expect(currentProfile(signedIn.data!)?.username).toBe('saanvi');
    expect((await signIn(signedOut, 'saanvi@example.com', 'wrong123')).error).toContain('incorrect');
  });
});
