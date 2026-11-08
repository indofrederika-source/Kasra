/**
 * Web Cryptography & Authentication Utilities for KASRA
 * Menggunakan Web Crypto API (SubtleCrypto) native browser:
 * - Algoritma: PBKDF2 dengan SHA-256
 * - Salt: Cryptographically Secure Random 128-bit (16 bytes)
 * - Iterations: 100,000 (sesuai standar rekomendasi OWASP)
 * - Password tidak pernah disimpan dalam bentuk plaintext!
 */

// Helper convert Uint8Array to hex string
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper convert hex string to Uint8Array
function hexToBuffer(hex: string): Uint8Array {
  const match = hex.match(/.{1,2}/g);
  if (!match) return new Uint8Array(0);
  return new Uint8Array(match.map((byte) => parseInt(byte, 16)));
}

/**
 * Generate cryptographically secure random salt (16 bytes)
 */
export function generateSalt(): string {
  const salt = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(salt);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    globalThis.crypto.getRandomValues(salt);
  } else {
    // Fallback if needed
    for (let i = 0; i < 16; i++) {
      salt[i] = Math.floor(Math.random() * 256);
    }
  }
  return bufferToHex(salt);
}

/**
 * Hash password menggunakan PBKDF2 + SHA-256 dengan 100,000 iterations
 */
export async function hashPassword(
  password: string,
  providedSalt?: string
): Promise<{ hash: string; salt: string }> {
  const saltHex = providedSalt || generateSalt();
  const saltBuffer = hexToBuffer(saltHex);

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const cryptoObj =
    typeof window !== 'undefined' && window.crypto?.subtle
      ? window.crypto.subtle
      : typeof globalThis !== 'undefined' && globalThis.crypto?.subtle
      ? globalThis.crypto.subtle
      : null;

  if (!cryptoObj) {
    throw new Error('Web Crypto API tidak didukung di lingkungan ini.');
  }

  // Import raw password key
  const keyMaterial = await cryptoObj.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive bits using PBKDF2 with SHA-256 and 100,000 iterations
  const derivedBits = await cryptoObj.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256 // 256 bits = 32 bytes
  );

  const hashHex = bufferToHex(derivedBits);

  return {
    hash: hashHex,
    salt: saltHex,
  };
}

/**
 * Verifikasi password dengan constant-time comparison untuk mencegah timing attacks
 */
export async function verifyPassword(
  attempt: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  try {
    const { hash } = await hashPassword(attempt, storedSalt);
    // Constant time comparison
    if (hash.length !== storedHash.length) {
      return false;
    }
    let diff = 0;
    for (let i = 0; i < hash.length; i++) {
      diff |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
    }
    return diff === 0;
  } catch (err) {
    console.error('Password verification failed:', err);
    return false;
  }
}

/**
 * Generate cryptographically secure random session token (32 bytes = 64 hex chars)
 */
export function generateSessionToken(): string {
  const token = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(token);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    globalThis.crypto.getRandomValues(token);
  } else {
    for (let i = 0; i < 32; i++) {
      token[i] = Math.floor(Math.random() * 256);
    }
  }
  return bufferToHex(token);
}

/**
 * Validasi Format Email Ketat (Client-side Pre-check)
 */
export function validateEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized || normalized.includes('..')) return false;
  const re =
    /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!re.test(normalized)) return false;
  const domain = normalized.split('@')[1] || '';
  const tld = domain.split('.').pop() || '';
  return /^[a-z]{2,24}$/.test(tld);
}

/**
 * Validasi Keamanan Password
 * Minimal 8 karakter, kombinasi huruf dan angka
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0 to 4
  message: string;
} {
  if (!password || password.length === 0) {
    return { isValid: false, score: 0, message: 'Password wajib diisi.' };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      score: 1,
      message: 'Password minimal terdiri dari 8 karakter.',
    };
  }

  let score = 1;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const hasUpperAndLower = /[a-z]/.test(password) && /[A-Z]/.test(password);

  if (hasLetter && hasNumber) score += 1;
  if (hasUpperAndLower) score += 1;
  if (hasSpecial && password.length >= 10) score += 1;

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      score,
      message: 'Password harus mengandung kombinasi huruf dan angka.',
    };
  }

  return {
    isValid: true,
    score,
    message: score >= 3 ? 'Password sangat kuat.' : 'Password cukup kuat.',
  };
}
