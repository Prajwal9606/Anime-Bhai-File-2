/**
 * Secure hashing utility for password and email protection.
 * Uses the Web Crypto API when available, and falls back to a 100% compliant
 * pure JavaScript SHA-256 implementation to ensure complete reliability in all contexts.
 */

// Pure JS SHA-256 implementation for guaranteed fallback compatibility
function sha256Fallback(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  let i, j; // Loop variables
  const words: number[] = [];
  const asciiLength = ascii.length;
  
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const wordsCount = ((asciiLength + 8) >> 6) + 1;
  const totalWords = wordsCount * 16;
  for (i = 0; i < totalWords; i++) {
    words[i] = 0;
  }
  for (i = 0; i < asciiLength; i++) {
    words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  words[asciiLength >> 2] |= 0x80 << (24 - (asciiLength % 4) * 8);
  words[totalWords - 1] = asciiLength * 8;

  for (i = 0; i < totalWords; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = hash.slice(0);

    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const w15 = w[j - 15];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const w2 = w[j - 2];
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const a = hash[0], e = hash[4];
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]);
      const t2 = s0 + maj;
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & hash[5]) ^ (~e & hash[6]);
      const t1 = hash[7] + s1 + ch + k[j] + (w[j] || 0);

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + t1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (t1 + t2) | 0;
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  let hex = '';
  for (i = 0; i < 8; i++) {
    const h = hash[i] >>> 0;
    hex += h.toString(16).padStart(8, '0');
  }
  return hex;
}

/**
 * Computes a SHA-256 hash representation of the input string.
 */
export async function hashString(str: string): Promise<string> {
  const normalized = str.trim();
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(normalized);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Web Crypto API failed, using fallback hash:', e);
    }
  }
  return sha256Fallback(normalized);
}

// Pre-computed hashes for secure administration
export const ADMIN_HASHES = {
  EMAILS: [
    '23774b4a38be9fd056fc98b8f02b3450f1145d9beb53fd217fa1787ba7f147bb', // prajwalgadade20@gmail.com
    'ccd8f7de82b9c3540a264c6376012bd8a8b06f5c6811e22bbdb9370b791b3a8a', // prajwalgadade96@gmail.com
    'f53895fe49ffd9c4814c8aadac1e1e56abe7ea036367f8e70fea6e090541ec78'  // prajwalgadade9606@gmail.com
  ],
  PASSWORD: '7ecfce39fcc57a6e7f844418d903fdae02b827328eb42a8ea13d905843979c6a' // Prajwal@@96!@#$
};

/**
 * Validates if a normalized email matches admin status based on SHA-256 hashes.
 */
export async function isAdminEmail(email: string): Promise<boolean> {
  const hash = await hashString(email.toLowerCase());
  return ADMIN_HASHES.EMAILS.includes(hash);
}

/**
 * Validates admin password.
 */
export async function isAdminPassword(password: string): Promise<boolean> {
  const hash = await hashString(password);
  return hash === ADMIN_HASHES.PASSWORD;
}
