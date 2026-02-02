#!/usr/bin/env node
/**
 * Oja POS — Activation Code Generator
 *
 * Usage:
 *   node scripts/generate-codes.js --count 10 --days 30
 *   node scripts/generate-codes.js --count 5 --days 365
 *
 * Options:
 *   --count   Number of codes to generate (default: 1)
 *   --days    Subscription duration: 30, 90, 180, or 365 (default: 30)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ── Config ───────────────────────────────────────────────────────────────────
const SECRET_KEY = 'oja-pos-2026-secret-key';

// No ambiguous chars (0, O, 1, I, L removed)
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

// Duration encoding map — single char → days
const DURATION_MAP = {
  30: 'A',
  90: 'B',
  180: 'C',
  365: 'D',
};
const VALID_DAYS = Object.keys(DURATION_MAP).map(Number);

// ── Helpers ──────────────────────────────────────────────────────────────────
function randomChars(n) {
  const chars = [];
  const bytes = crypto.randomBytes(n);
  for (let i = 0; i < n; i++) {
    chars.push(ALPHABET[bytes[i] % ALPHABET.length]);
  }
  return chars.join('');
}

function hmacSign(data) {
  return crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');
}

function encodeToAlphabet(hex, length) {
  // Convert hex string to a big number, then to our alphabet
  let num = BigInt('0x' + hex);
  const base = BigInt(ALPHABET.length);
  const chars = [];
  for (let i = 0; i < length; i++) {
    chars.push(ALPHABET[Number(num % base)]);
    num = num / base;
  }
  return chars.join('');
}

/**
 * Generate a single activation code.
 *
 * Format: OJA-XXXX-XXXX
 *   Segment 1 (4 chars): durationChar + 3 random chars (payload)
 *   Segment 2 (4 chars): HMAC signature of segment 1 (encoded in our alphabet)
 */
function generateCode(days) {
  const durationChar = DURATION_MAP[days];
  if (!durationChar) throw new Error(`Invalid days: ${days}. Use ${VALID_DAYS.join(', ')}`);

  const payload = durationChar + randomChars(3);
  const sig = hmacSign(payload);
  const sigEncoded = encodeToAlphabet(sig, 4);

  return `OJA-${payload}-${sigEncoded}`;
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const getArg = (name, def) => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : def;
  };

  const count = parseInt(getArg('count', '1'), 10);
  const days = parseInt(getArg('days', '30'), 10);

  if (!VALID_DAYS.includes(days)) {
    console.error(`Error: --days must be one of: ${VALID_DAYS.join(', ')}`);
    process.exit(1);
  }
  if (count < 1 || count > 1000) {
    console.error('Error: --count must be between 1 and 1000');
    process.exit(1);
  }

  console.log(`\nGenerating ${count} activation code(s) for ${days}-day Business plan...\n`);

  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = generateCode(days);
    codes.push(code);
    console.log(`  ${code}`);
  }

  // Save to file
  const today = new Date().toISOString().slice(0, 10);
  const filename = `codes-${today}.txt`;
  const filepath = path.join(__dirname, filename);

  const header = `# Oja POS Activation Codes — ${today}\n# Plan: Business | Duration: ${days} days | Count: ${count}\n\n`;
  const content = header + codes.join('\n') + '\n';

  // Append if file exists for same day
  if (fs.existsSync(filepath)) {
    fs.appendFileSync(filepath, '\n' + content);
  } else {
    fs.writeFileSync(filepath, content);
  }

  console.log(`\nSaved to: ${filepath}`);
}

main();
