// srp_utils.ts
// ===============================================
// Secure Remote Password (SRP) protocol utilities
// ===============================================
//
// PURPOSE:
// This file provides core cryptographic tools for SRP (Secure Remote Password),
// a protocol that allows two parties (client and server) to authenticate and
// agree on a shared secret key based on a password — WITHOUT ever sending the
// actual password across the network.
//
// These functions implement the mathematical backbone of SRP-6a (RFC 5054):
//   • Big integer arithmetic (modular exponentiation)
//   • Cryptographic hashing (SHA-256)
//   • Secure random number generation
//   • Conversion between BigInts, bytes, and hex strings
//
// These low-level functions are called during:
//   1. Account creation (computing and storing password verifier)
//   2. Authentication handshake (computing A, B, S, K, M1, M2)
//   3. Proof verification (ensuring both sides derive the same session key)
//

// 1. TextEncoder converts JavaScript strings into UTF-8 byte arrays.
// WHY: The hash function only works on raw bytes, not JS strings.
// WHERE USED: When hashing textual data like username or password.
const encoder = new TextEncoder();

// 2. Public SRP Group Parameters (RFC 5054 2048-bit group)
// Each SRP group defines:
//   - A large "safe prime" N (where N = 2q + 1, q is also prime)
//   - A small generator g
// These constants must be known and identical to both client and server.
// They are standardized and publicly known — never secret.
//
// SECURITY:
// - 2048-bit N gives ~112-bit cryptographic strength.
// - The group structure prevents weak key attacks.
export const N_hex = `
AC6BDB41324A9A9BF166DE5E1389582FAF72B6651987EE07
FC3192943DB56050A37329CBB4A099ED8193E0757767A13D
D52312AB4B03310DCD7F48A9DA04FD50E8083969EDB767B0
CF6096F3C0D8D6E9C1F8F8A0E4C8E88C6A1A2F6D1C6D3C6A
62D508F57DBF9BD3B0A6BBE117577A615D6C770988C0BAD9
C0C3D29E5309CDA79B846D1C50E55B2DD81A6FA6D58EBB10
BF3A8A94A57F9F3F8E2BFA3C4A776C9A72F1
`.replace(/\s+/g, ''); // clean whitespace/newlines to produce a single hex string

// Generator for the multiplicative group modulo N.
// g=2 is widely used, small, and safe for this N.
export const g_hex = '02';

// Convert hex constants into big integers for arithmetic.
export const N = BigInt('0x' + N_hex);
export const g = BigInt('0x' + g_hex);

// Calculate byte length of N (used for consistent padding of big integers).
// This ensures all hashed numbers have a fixed byte representation.
export const N_BYTES = Math.ceil(N.toString(16).length / 2);

// 3. hex <-> BigInt conversion utilities
// WHY: SRP data is often exchanged as hex strings between client and server,
// but internally, we need BigInts for modular arithmetic.
export const hexToBigInt = (hex: string): bigint => BigInt('0x' + hex);

export const bigIntToHex = (num: bigint): string => {
  let hex = num.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  return hex.toLowerCase();
};

// 4. PAD(x): Left-pad BigInt x to the same byte length as N
// WHY IMPORTANT:
// - SRP defines that all hashed integers must be represented as |N|-byte arrays.
// - This ensures both client and server hash identical-length values.
// - If one side sends shorter encodings, they’d compute different hashes (auth fails).
//
// EXAMPLE:
//   Suppose N is 256 bytes long (2048-bit).
//   If A = 0x1234 → [0x12, 0x34], that’s only 2 bytes.
//   PAD(A) makes it 256 bytes by adding 254 leading zeros.
//
// WHERE USED: before hashing A, B, N, g, S, etc.
export function PAD(x: bigint): Uint8Array {
  let hex = x.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const need = N_BYTES * 2;
  if (hex.length < need) hex = '0'.repeat(need - hex.length) + hex;
  const bytes = hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16));
  return new Uint8Array(bytes);
}

// 5. H(...parts): Compute SHA-256 over concatenated inputs
// HOW IT WORKS:
//   - Takes any number of inputs (bigints, strings, byte arrays).
//   - Converts all to bytes, concatenates them, and computes SHA-256.
//   - Returns lowercase hex digest.
//
// WHY IT’S CRUCIAL:
// SRP defines several key hashes used throughout the protocol:
//   - x = H(salt || H(username:password))
//   - u = H(PAD(A) || PAD(B))        ← “scrambling parameter”
//   - k = H(N || PAD(g))             ← multiplier
//   - K = H(S)                       ← shared session key
//   - M1 = H(A, B, K)                ← client proof
//   - M2 = H(A, M1, K)               ← server proof
//
// SECURITY: SHA-256 provides preimage and collision resistance,
// binding all concatenated inputs into a single 256-bit digest.
export async function H(...parts: (bigint | Uint8Array | string)[]): Promise<string> {
  const chunks: number[] = [];

  for (const p of parts) {
    if (typeof p === 'bigint') chunks.push(...PAD(p)); // normalized integers
    else if (p instanceof Uint8Array) chunks.push(...p); // raw bytes
    else chunks.push(...encoder.encode(p)); // UTF-8 for strings
  }

  // Compute SHA-256 digest
  const buf = await crypto.subtle.digest('SHA-256', new Uint8Array(chunks));
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// 6. randomBigInt(bytes): Generate a cryptographically secure random BigInt
// WHY:
// - Random secrets are essential for security.
// - In SRP, both client and server must generate unique, unpredictable secrets:
//     client: a → A = g^a mod N
//     server: b → B = (kv + g^b) mod N
// - Weak or repeated random numbers would leak private keys or enable replay attacks.
//
// HOW:
// - Uses `crypto.getRandomValues()` → CSPRNG source (secure, system entropy).
// - Converts the random byte array into a BigInt.
export function randomBigInt(bytes: number): bigint {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  const hex = Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return BigInt('0x' + hex);
}

// 7. modPow(base, exp, mod): Fast modular exponentiation
// PURPOSE: Compute (base ^ exp) mod mod efficiently.
//
// WHY IT’S CRUCIAL:
// Modular exponentiation is the heart of SRP and Diffie-Hellman.
// SRP relies on computing huge powers mod N:
//   - A = g^a mod N   (client’s public ephemeral key)
//   - B = (k*v + g^b) mod N  (server’s public ephemeral key)
//   - S (shared secret) involves exponentiations like (B - k*v)^(a + u*x) mod N.
//

export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let res = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp & 1n) res = (res * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return res;
}

// 8. toHex64(hex): Force any hex string to 64 characters (32 bytes)
// WHY:
// - SHA-256 always produces 64 hex chars (32 bytes).
// - Some stored digests or comparisons rely on a consistent hex length.
//
// WHERE USED:
// - Normalizing hashed values like H(A, B, S, K) for comparison or logging.
export function toHex64(hex: string): string {
  const lower = hex.toLowerCase();
  if (lower.length >= 64) return lower.slice(-64); // trim extra
  return '0'.repeat(64 - lower.length) + lower; // pad if shorter
}

// 9. bytesFromHex(hex): Convert hex string to byte array

// WHY:
// - SRP messages are often transmitted in hex (A, B, salt, verifier).
// - To hash or manipulate them, we need raw bytes.
//
// WHERE USED:
// - Converting received hex (A, B) into bytes before computing H().
// - Reconstructing stored verifiers or salts for validation.
export function bytesFromHex(hex: string): Uint8Array {
  let h = hex.toLowerCase();
  if (h.length % 2) h = '0' + h; // ensure even length (1 byte = 2 chars)
  return new Uint8Array(h.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
}
