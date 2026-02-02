/**
 * Oja POS — Activation Code Validator (offline)
 *
 * Code format: OJA-XXXX-XXXX
 *   Segment 1 (4 chars): durationChar + 3 random chars
 *   Segment 2 (4 chars): HMAC-SHA256 signature of segment 1 (encoded in alphabet)
 */

import { Platform } from 'react-native';
import type { PlanType } from '@/store/subscriptionStore';

// TODO: BEFORE LAUNCH — Move code validation to Supabase Edge Function.
// This secret in client code can be extracted by decompiling the app.
const _k = [111,106,97,45,112,111,115,45,50,48,50,54,45,115,101,99,114,101,116,45,107,101,121];
const SECRET_KEY = String.fromCharCode(..._k);
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

const DURATION_DECODE: Record<string, number> = {
  A: 30,
  B: 90,
  C: 180,
  D: 365,
};

type ValidResult = { valid: true; days: number; plan: PlanType };
type InvalidResult = { valid: false };
export type ValidationResult = ValidResult | InvalidResult;

function encodeToAlphabet(hexStr: string, length: number): string {
  let num = BigInt('0x' + hexStr);
  const base = BigInt(ALPHABET.length);
  const chars: string[] = [];
  for (let i = 0; i < length; i++) {
    chars.push(ALPHABET[Number(num % base)]);
    num = num / base;
  }
  return chars.join('');
}

/**
 * HMAC-SHA256 that works on both web and native.
 * Uses SubtleCrypto on web, and a simple JS implementation as fallback.
 */
function hmacSha256Hex(key: string, message: string): string {
  // Pure JS HMAC-SHA256 implementation for React Native compatibility
  return jsSha256Hmac(key, message);
}

// ── Minimal JS SHA-256 + HMAC (no native deps) ────────────────────────────

function jsSha256(message: Uint8Array): Uint8Array {
  const K: number[] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const rotr = (x: number, n: number) => ((x >>> n) | (x << (32 - n))) >>> 0;

  // Pre-processing: padding
  const bitLen = message.length * 8;
  const padded = new Uint8Array(Math.ceil((message.length + 9) / 64) * 64);
  padded.set(message);
  padded[message.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, bitLen, false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  for (let offset = 0; offset < padded.length; offset += 64) {
    const w = new Uint32Array(64);
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 2);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  const result = new Uint8Array(32);
  const rv = new DataView(result.buffer);
  rv.setUint32(0, h0); rv.setUint32(4, h1); rv.setUint32(8, h2); rv.setUint32(12, h3);
  rv.setUint32(16, h4); rv.setUint32(20, h5); rv.setUint32(24, h6); rv.setUint32(28, h7);
  return result;
}

function strToBytes(s: string): Uint8Array {
  const arr = [];
  for (let i = 0; i < s.length; i++) arr.push(s.charCodeAt(i));
  return new Uint8Array(arr);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function jsSha256Hmac(key: string, message: string): string {
  const blockSize = 64;
  let keyBytes = strToBytes(key);

  if (keyBytes.length > blockSize) {
    keyBytes = jsSha256(keyBytes);
  }

  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(keyBytes);

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = paddedKey[i] ^ 0x5c;
    iKeyPad[i] = paddedKey[i] ^ 0x36;
  }

  const msgBytes = strToBytes(message);
  const inner = new Uint8Array(blockSize + msgBytes.length);
  inner.set(iKeyPad);
  inner.set(msgBytes, blockSize);
  const innerHash = jsSha256(inner);

  const outer = new Uint8Array(blockSize + 32);
  outer.set(oKeyPad);
  outer.set(innerHash, blockSize);
  const finalHash = jsSha256(outer);

  return bytesToHex(finalHash);
}

// ── Public API ────────────────────────────────────────────────────────────

export function validateCode(code: string): ValidationResult {
  // Normalize: uppercase, trim
  const normalized = code.toUpperCase().trim();

  // Check format: OJA-XXXX-XXXX
  const match = normalized.match(/^OJA-([A-Z2-9]{4})-([A-Z2-9]{4})$/);
  if (!match) return { valid: false };

  const payload = match[1]; // 4 chars: durationChar + 3 random
  const sigPart = match[2]; // 4 chars: encoded HMAC signature

  // Decode duration
  const durationChar = payload[0];
  const days = DURATION_DECODE[durationChar];
  if (!days) return { valid: false };

  // Verify HMAC signature
  const expectedSig = hmacSha256Hex(SECRET_KEY, payload);
  const expectedEncoded = encodeToAlphabet(expectedSig, 4);

  if (sigPart !== expectedEncoded) return { valid: false };

  // Plan detection: codes starting with 'G' prefix in the random part → growth plan
  // Otherwise default to business
  const planIndicator = payload[1]; // second char after duration
  const plan: PlanType = planIndicator === 'G' ? 'growth' : 'business';

  return {
    valid: true,
    days,
    plan,
  };
}

/**
 * Mask a code for display: OJA-****-XXXX
 */
export function maskCode(code: string): string {
  const parts = code.split('-');
  if (parts.length !== 3) return code;
  return `OJA-****-${parts[2]}`;
}
