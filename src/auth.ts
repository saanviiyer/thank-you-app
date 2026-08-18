export type Profile = {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  avatar?: string;
  joinedAt: string;
};

type StoredAccount = Profile & { salt: string; passwordHash: string };
export type AuthData = {
  version: 1;
  accounts: StoredAccount[];
  sessionId?: string;
};

export const AUTH_KEY = "thank-you.auth.v1";
const emptyAuth: AuthData = { version: 1, accounts: [] };

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase().replace(/^@+/, "");
}
export function validUsername(value: string): boolean {
  return /^[a-z0-9._]{3,20}$/.test(value);
}
export function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
export function strongPassword(value: string): boolean {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
}
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function parseAuth(raw: string | null): AuthData {
  if (!raw) return emptyAuth;
  try {
    const value = JSON.parse(raw) as AuthData;
    return value.version === 1 && Array.isArray(value.accounts)
      ? value
      : emptyAuth;
  } catch {
    return emptyAuth;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}
async function passwordHash(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new TextEncoder().encode(salt),
      iterations: 210_000,
    },
    key,
    256,
  );
  return bytesToBase64(new Uint8Array(bits));
}

export async function createAccount(
  data: AuthData,
  input: { name: string; username: string; email: string; password: string },
): Promise<{ data?: AuthData; profile?: Profile; error?: string }> {
  const name = input.name.trim().slice(0, 80);
  const username = normalizeUsername(input.username);
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) return { error: "Enter your full name." };
  if (!validUsername(username))
    return { error: "Use 3–20 letters, numbers, periods, or underscores." };
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (!strongPassword(input.password))
    return { error: "Use at least 8 characters with a letter and a number." };
  if (data.accounts.some((account) => account.username === username))
    return { error: "That username is already taken on this browser." };
  if (data.accounts.some((account) => account.email === email))
    return { error: "An account with that email already exists." };
  const id = crypto.randomUUID();
  const salt = crypto.randomUUID();
  const profile: Profile = {
    id,
    name,
    username,
    email,
    bio: "Trying to leave things a little better than I found them.",
    joinedAt: new Date().toISOString(),
  };
  const account: StoredAccount = {
    ...profile,
    salt,
    passwordHash: await passwordHash(input.password, salt),
  };
  return {
    data: { version: 1, accounts: [...data.accounts, account], sessionId: id },
    profile,
  };
}

export async function signIn(
  data: AuthData,
  email: string,
  password: string,
): Promise<{ data?: AuthData; profile?: Profile; error?: string }> {
  const account = data.accounts.find(
    (item) => item.email === email.trim().toLowerCase(),
  );
  if (
    !account ||
    account.passwordHash !== (await passwordHash(password, account.salt))
  )
    return { error: "The email or password is incorrect." };
  const { salt: _salt, passwordHash: _hash, ...profile } = account;
  return { data: { ...data, sessionId: account.id }, profile };
}

export function currentProfile(data: AuthData): Profile | undefined {
  const account = data.accounts.find((item) => item.id === data.sessionId);
  if (!account) return undefined;
  const { salt: _salt, passwordHash: _hash, ...profile } = account;
  return profile;
}

export function updateProfile(data: AuthData, profile: Profile): AuthData {
  return {
    ...data,
    accounts: data.accounts.map((account) =>
      account.id === profile.id ? { ...account, ...profile } : account,
    ),
  };
}

export function deleteAccount(data: AuthData, id: string): AuthData {
  return {
    version: 1,
    accounts: data.accounts.filter((account) => account.id !== id),
  };
}
