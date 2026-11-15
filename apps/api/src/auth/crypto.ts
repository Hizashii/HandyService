const PASSWORD_ALGORITHM = 'PBKDF2';
const PASSWORD_HASH = 'SHA-256';
/**
 * PBKDF2 rounds for new password hashes. 100,000 is the most the Cloudflare Workers runtime allows
 * for PBKDF2 (higher counts throw, which made registration and login return 500 once deployed, even
 * though local development accepts more). Existing hashes keep the count stored inside them, and
 * verification still refuses anything below 100,000.
 */
export const PASSWORD_ITERATIONS = 100_000;
const PASSWORD_KEY_LENGTH = 256;
const PASSWORD_SALT_BYTES = 16;
const SESSION_TOKEN_BYTES = 32;

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(PASSWORD_SALT_BYTES));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    PASSWORD_ALGORITHM,
    false,
    ['deriveBits'],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: PASSWORD_ALGORITHM,
      salt,
      iterations: PASSWORD_ITERATIONS,
      hash: PASSWORD_HASH,
    },
    key,
    PASSWORD_KEY_LENGTH,
  );

  return [
    'pbkdf2-sha256',
    PASSWORD_ITERATIONS,
    base64UrlEncode(salt),
    base64UrlEncode(new Uint8Array(derivedBits)),
  ].join('$');
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, iterationsText, encodedSalt, encodedExpected] = encodedHash.split('$');
  const iterations = Number(iterationsText);
  if (
    algorithm !== 'pbkdf2-sha256' ||
    !Number.isSafeInteger(iterations) ||
    iterations < 100_000 ||
    !encodedSalt ||
    !encodedExpected
  ) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    PASSWORD_ALGORITHM,
    false,
    ['deriveBits'],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: PASSWORD_ALGORITHM,
      salt: base64UrlDecode(encodedSalt) as BufferSource,
      iterations,
      hash: PASSWORD_HASH,
    },
    key,
    PASSWORD_KEY_LENGTH,
  );

  return constantTimeEqual(new Uint8Array(derivedBits), base64UrlDecode(encodedExpected));
}

export const DUMMY_PASSWORD_HASH = [
  'pbkdf2-sha256',
  PASSWORD_ITERATIONS,
  base64UrlEncode(new Uint8Array(PASSWORD_SALT_BYTES)),
  base64UrlEncode(new Uint8Array(PASSWORD_KEY_LENGTH / 8)),
].join('$');

export function createSessionToken(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(SESSION_TOKEN_BYTES)));
}

export async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return base64UrlEncode(new Uint8Array(digest));
}
