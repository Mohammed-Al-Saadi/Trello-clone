import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  H,
  modPow,
  randomBigInt,
  N,
  g,
  bigIntToHex,
  bytesFromHex,
  toHex64,
} from '../../utils/srp_utils';

@Injectable({ providedIn: 'root' })
export class SrpAuthService {
  private http = inject(HttpClient);

  private BASE_URL = 'http://127.0.0.1:8080';

  async login(emailRaw: string, password: string) {
    // Normalize the identity string to keep server and client consistent
    const email = emailRaw.trim().toLowerCase();

    // (1) CLIENT EPHEMERAL: choose random a, compute A = g^a mod N
    // WHY: 'a' is the client's private ephemeral exponent (fresh every login).
    //      'A' is the public ephemeral key sent to the server.
    let a: bigint, A: bigint;
    do {
      a = randomBigInt(32); // 32 bytes = 256-bit random exponent (good default)
      A = modPow(g, a, N);
    } while (A % N === 0n); // ensure A is not 0 mod N

    // Hex-encode A for transport
    const A_hex = bigIntToHex(A);

    // (2) START: send identity and A; receive salt s and server key B
    // SERVER SHOULD RETURN:
    //   - salt (hex)
    //   - B (hex), the server's public ephemeral key
    //   - session_id to bind the two-phase login (start/verify)
    const start: any = await firstValueFrom(
      this.http.post(`${this.BASE_URL}/srp-login/start`, { email, A: A_hex })
    );
    const salt_hex: string = String(start.salt).toLowerCase();
    const B_hex: string = String(start.B).toLowerCase();
    const session_id: string = start.session_id;

    // Parse salt and B as bigints for math
    const s = BigInt('0x' + salt_hex);
    const B = BigInt('0x' + B_hex);

    // Sanity check: SRP requires B % N != 0
    if (B % N === 0n) throw new Error('Bad B');

    // (3) MULTIPLIER k and SCRAMBLING PARAMETER u
    // k (multiplier): typically k = H(N, g)
    // WHY k: couples the server's public value B to the stored verifier v.
    //        Server computes B = (k*v + g^b) mod N; client uses k in (B - k * g^x).
    //        Prevents degenerate cases where B ~ g^b only.
    //
    // u (scrambling parameter): u = H(A, B)
    // WHY u: binds A and B together, preventing pre-computation and replay.
    //        It ensures the exponent used to derive S depends on both parties’
    const k = BigInt('0x' + (await H(N, g)));
    const u = BigInt('0x' + (await H(A, B)));

    // (4) PASSWORD PRIVATE KEY x
    // RFC 5054: x = H( salt || H(I ":" p) )
    // WHY x: encodes the password (and identity) into a large integer.
    //        Server stores v = g^x mod N; neither side stores the password.
    //
    // NOTE on H(): In utils, passing bigints to H() applies PAD(|N| bytes).
    // Below we follow your client’s convention from registration:
    //     inner = H("email:password")
    //     x = H(s, inner)    (both bigints → padded)
    // Make sure server uses the same exact encoding rule.
    const innerHex = await H(`${email}:${password}`); 
    const inner = BigInt('0x' + innerHex);
    const x = BigInt('0x' + (await H(s, inner)));

    // (5) SHARED SECRET S (client side)
    // Client formula (SRP-6a):
    //   S = (B - k * g^x) ^ (a + u*x) mod N
    //
    // WHY:
    // - (B - k*g^x) removes the verifier component from B so the secret
    //   depends on server’s fresh 'b' and client’s password-derived x.
    // - Exponent (a + u*x) ties in the client secret 'a' and the mixing u*x.
    //
    // Values must not be negative.
    const gx = modPow(g, x, N); // g^x mod N
    let base = (B - ((k * gx) % N)) % N; // (B - k * g^x) mod N
    if (base < 0n) base += N; // normalize to [0, N)
    const exp = a + u * x; // (a + u*x)
    const S = modPow(base, exp, N); // shared secret S

    // (6) SESSION KEY K = H(S)
    // WHY K: symmetric keying material derived from S.
    //        Both sides compute the same S → same K.
    // WHERE USED: to produce proofs (M1, M2) and optionally encrypt session data.
    const K = BigInt('0x' + (await H(S)));

    // (7) CLIENT PROOF M1
    // Purpose: Client proves to server it computed the correct session key K,
    // without revealing K or the password.
    //
    // Your definition here: M1 = H(email | salt | A | B | K)
    // (Some specs/examples use H(A, B, K). Your variant is fine if server matches.)
    //
    // DETAILS:
    // - Use consistent encodings: strings → UTF-8, bigints → PAD, salt → raw bytes.
    // - toHex64: normalize to 64 hex chars (SHA-256 length) for reliable comparison.
    const M1_hex = toHex64(await H(email, bytesFromHex(salt_hex), A, B, K));

    // (8) SEND M1 FOR VERIFICATION
    // Server will:
    //   - Recompute K server-side from its S = (A * v^u)^b mod N
    //   - Recompute M1 and compare
    //   - If OK, respond with M2 (server proof)
    const verify: any = await firstValueFrom(
      this.http.post(`${this.BASE_URL}/srp-login/verify`, { email, M1: M1_hex, session_id })
    );

    // (9) SERVER PROOF M2 = H(A | M1 | K)
    // WHY M2: Mutual authentication. Server proves to the client that it also
    //         derived the same session key K (and isn’t a MITM).
    // You locally compute M2 and compare with server's response.
    const M2_calc = toHex64(await H(A, BigInt('0x' + M1_hex), K));
    if (String(verify.M2).toLowerCase() !== M2_calc) {
      throw new Error('M2 mismatch');
    }

    return true;
  }
}
