import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { H, N, g, modPow, randomBigInt, bigIntToHex } from '../../utils/srp_utils';

@Injectable({ providedIn: 'root' })
export class SrpRegisterService {
  private http = inject(HttpClient);

  private BASE_URL = 'http://127.0.0.1:8080';

  async register(full_name: string, emailRaw: string, password: string) {
    // Normalize the login identifier:
    //  - trim spaces
    //  - lowercase (prevents case-mismatch: "User@X.com" vs "user@x.com")
    const email = emailRaw.trim().toLowerCase();

    // 1) Generate salt 's'
    // SRP stores a per-user random salt so identical passwords don’t result in identical verifiers.
    const s = randomBigInt(16);

    // Convert salt to hex for transport/storage.
    const salt_hex = bigIntToHex(s);

    // 2) Compute private key 'x'
    // RFC 5054 definition (byte-wise): x = H( salt | H( I ":" p ) )
    //   - I is identity (username/email)
    //   - p is password
    //
    // Below, we compute inner = H("email:password") as hex, then compute x = H(s, inner).
    // NOTE: Your H() helper treats:
    //  - strings as UTF-8 bytes
    //  - bigints as PAD(x) to |N| bytes (fixed width)
    // That means salting with a BigInt will be padded to |N| bytes (non-standard but consistent if both ends do it).
    //
    // Compute inner = H(I ":" p) -> hex string
    const innerHex = await H(`${email}:${password}`);

    // Compute x = H( s || inner )
    // Here you pass 's' (bigint) and the inner hash (as a bigint from hex).
    // Because H() PADs bigints to |N| bytes, this is effectively:
    //   x = H( PAD(s) || PAD(inner) )
    // "0x" when converting a hex string to BigInt. It tells BigInt to interpret the string as hexadecimal.
    const x = BigInt('0x' + (await H(s, BigInt('0x' + innerHex))));

    // 3) Compute verifier 'v'
    // v = g^x mod N
    // The server stores (salt, v). It never stores the password nor x.
    const v = modPow(g, x, N);

    // Convert verifier to hex for transport/storage
    const verifier_hex = bigIntToHex(v);

    // 4) Send registration payload
    // The backend:
    //   - Persist (full_name, email, salt_hex, verifier_hex)
    //   - Reject duplicates
    //   - Never store raw password
    const body = { full_name, email, salt: salt_hex, verifier: verifier_hex };

    // POST /srp-register with JSON body.
    return await firstValueFrom(this.http.post(`${this.BASE_URL}/srp-register`, body));
  }
}
