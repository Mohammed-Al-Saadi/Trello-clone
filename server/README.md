# SRP-6a Authentication — README

This implementation provides a minimal and educational version of the **Secure Remote Password (SRP-6a)** authentication protocol (RFC 5054).

It was created by following and adapting concepts from the **Nimbus SRP** and **Thinbus SRP** libraries, with several internal tweaks and simplifications for clarity and modern TypeScript use.

⚠️ **Important Note:**  
Although this code is inspired by Nimbus and Thinbus SRP, it is **not binary compatible** with their official server or client implementations.  
This means that values such as `A`, `B`, `x`, `v`, `M1`, `M2`, etc., produced by this version will **not interoperate** directly with those libraries.  
The padding, hashing, and concatenation rules have been adjusted for simplicity and consistency within this implementation only.

---

### ⚠️ Compatibility Warning

- Not compatible with:
  - **Nimbus SRP** Java library (`com.nimbusds.srp6`)
  - **Thinbus SRP** JavaScript/Node.js implementations
- This version uses its own encoding format:
  - BigInts are padded to `|N|` bytes before hashing.
  - Hash inputs may differ in order or type (`bigint`, `string`, or `Uint8Array`).

---

### Purpose

This implementation aims to:

- Demonstrate how SRP-6a can be built from first principles.
- Be small, dependency-free, and easy to follow.
- Serve as a foundation for custom SRP-based authentication systems in **TypeScript or JavaScript** environments.

---

## 📖 Routes Description

This API exposes **three main endpoints** for SRP-based registration and login:

### 🔹 `POST /srp-register`

Client registers by sending:

- **salt** — Random bytes generated on the client side.
- **verifier** — A cryptographic value derived from the password (computed locally).

> The server never receives or stores the raw password — only the `salt` and `verifier`.

---

### 🔹 `POST /srp-login/start`

Client begins login by sending:

- **A** — Client’s ephemeral public key, computed from a random secret `a`.

Server responds with:

- **salt** — Previously stored salt for that user.
- **B** — Server’s ephemeral public key.
- **session_id** — Temporary identifier linking this handshake to the next step.

---

### 🔹 `POST /srp-login/verify`

Client proves password knowledge by sending:

- **M1** — A cryptographic proof computed using shared values from both sides.

Server verifies it and responds with:

- **M2** — Server’s own proof, confirming both share the same session key.

✅ Once verified, both client and server have a shared secure session key **K**, while the server never learns the password.

---

## 🚀 Run the App (Quick Start)

1. **Go to the backend app folder**

   ```bash
   cd backend/app
   ```

2. **create .env file to hold db env values**
3. **Install packages pip3 install -r requirements.txt**
4. **Run database**
5. **Run app python main.py**

---

## 1) What is SRP

SRP lets a user prove they know their password and agree on a fresh session key with the server **without sending the password** and **without the server storing the password**. The server stores only a **salt** and a **verifier** derived from the password. A database leak doesn’t reveal passwords, and network eavesdroppers can’t replay login data.

---

## 2) Key Concepts: What Each Symbol Means

- **N, g (group parameters):** Shared, public numbers that define the safe mathematical space where operations happen. Same on both sides.
- **Salt (s):** A random value (bytes) tied to each account so that password derivations are unique per user (prevents rainbow tables). Sent as hex; stored as bytes.
- **Private exponent (x):** Secret integer derived from salt + identity + password: **`x = H(s, H(I ":" p))`**. Never sent or stored.
- **Verifier (v):** A password-derived value stored by the server that replaces the need to store actual passwords: **`v = g^x mod N`**.
- **Ephemeral secrets (a, b):** One-time random numbers picked by client and server during each login. They’re thrown away after the attempt.
- **Ephemeral publics (A, B):** Public counterparts computed from those secrets. These travel over the network and are safe to reveal.
- **Scrambler (u):** A hash that mixes A and B together so attackers can’t choose values that make the math weak: **`u = H(A, B)`**.
- **Multiplier (k):** Binds the verifier into the server’s public value, preventing certain manipulations: **`k = H(N, g)`**.
- **Shared secret (S):** A value both sides compute independently but identically when the password is correct. It never leaves either side.
- **Session key (K):** A hash of S used to prove success and optionally derive further keys: **`K = H(S)`**.
- **Proofs (M1 and M2):** Short hashes that prove to the other party that you derived the same K — without revealing S or the password.

---

## 3) Data Flows (No Payloads, Just Meaning)

- **Registration:**

  - Client → Server: “Here is my email, my random salt, and a verifier derived from my password.”
  - Server stores salt and verifier for that email.

- **Login, Step 1 (Start):**

  - Client → Server: “Here is my email and my one-time public A.”
  - Server → Client: “Here are your stored salt, my one-time public B, and a session id.”
  - Server (internally): “I’ve saved the temporary login state for this session id.”

- **Login, Step 2 (Verify):**
  - Client → Server: “Using what you sent and my password, I computed K and here’s a proof M1.”
  - Server → Client: “Your proof matches. Here’s my proof M2 so you know I computed the same K.”
  - Server (internally): “I’ve deleted the temporary login state.”

---

## 4) Registration — What Happens (No a/A Yet)

**Goal:** Put only **salt** and **verifier** on the server, never the password.

### Frontend (client)

1. User types full name, email, and password.
2. The client creates a random **salt** `s`.
3. Derive the privateKey : **`x = H(s, H(user ":" p))`** (where **user** is the normalized identity, e.g., lowercase email).
4. Compute the **verifier**: **`v = g^x mod N`**.
5. The client sends **email, salt, verifier** to the server.
6. The client does **not** send the password and does **not** keep long-term copies of `x`.

### Backend (server)

1. Validates the input.
2. Stores **email, salt (bytes), verifier (bytes)** in the database (and the full name). That’s it.

> **At end:** The database holds salt + verifier, not passwords.

---

## 5) Login (Handshake) — What Happens

**Goal:** Both parties independently recreate the same secret and confirm it to each other, proving the password is correct — without sending the password.

### Step 1 — Start (Client → Server)

#### Frontend

- Picks a fresh, random **one-time secret its private never send to backend** **`a`** (≥ 256 bits).
- Computes the **public ephemeral key for the client** **`A = g^a mod N`**.
- Sends **`{ email: user, A }`**.

#### Backend

- Checks that **`A % N != 0`** (reject degenerate value).

- Looks up the user’s **salt** and **verifier** in the database:

  - **`s` (salt):** random per-user bytes used (with `user` and `p`) to derive privateKey `x` via **`x = H(s, H(I ":" p))`**.
  - **`v` (verifier):** server-stored `g^x mod N`, derived at registration; replaces storing the password.

- Picks its own fresh **one-time secret its a private key will not be sent to frontend** **`b`** and computes:

  - **`k = H(N, g)`** — the **multiplier**, binding `v` into the server’s public value.
  - **`B = (k·v + g^b) mod N`** — the **server public key**, which includes both the long-term verifier and fresh randomness.
  - **`u = H(A, B)`** — the **scrambler** that couples `A` and `B`, preventing precomputation/cheating.

- Saves these temporary login values under a **short-lived session id**: `(email, A, B, b, v, u, s)`.

- Returns **`{ salt: s_hex, B, session_id }`** to the client.

### Step 2 — Verify (Client → Server)

#### Frontend

- Re-derives **`x = H(s, H(I ":" p))`** using the returned `s` and the user’s password `p`.
- Computes the **shared secret**
  **`S = (B − k·g^x)^(a + u·x) mod N`**.
- Hashes to **`K = H(S)`** and prepares the **client proof**
  **`M1 = H(I, s, A, B, K)`**.
- Sends **`{ session_id, email: I, M1 }`** to the server.

#### Backend

- Loads the temporary values by **`session_id`**.
- Reconstructs the **shared secret**
  **`S = (A · v^u)^b mod N`**, then **`K = H(S)`**.
- Computes the expected client proof and compares:
  **`M1_expected = H(I, s, A, B, K)`**.
- If the proof matches, the user is authenticated. The server replies with its own **server proof**
  **`M2 = H(A, M1, K)`** to confirm mutual success.
- The temporary session data is immediately deleted.

#### Frontend (finalization)

- Verifies the **server proof** matches expectations: **`M2 == H(A, M1, K)`**. If yes, both parties share `K` and know the other does too.
- Proceed to a normal login session (JWT or secure cookie).

---

## 6) What the Server Stores

- **Permanently:** For each user — **email**, **salt (bytes)**, **verifier (bytes)** (plus profile fields like full name).
- **Temporarily during login:** By **session id** — `(email, A, B, b, v, u, s)`. Deleted after the attempt or timeout.

---

## 7) Security Rationale (Why This Is Strong)

- **Password never sent** and not stored on the server.
- **Per-account salts** eliminate precomputed attack tables.
- **Fresh one-time secrets** every login prevent replay.
- **Scrambler and multiplier** block parameter-manipulation tricks.
- **Short proofs** tie together all important values so messages can’t be reused out of context.

---

## 8) SRP Math — Full Sequence (SRP-6a)

### Constants (both sides)

- Choose **N** (RFC 5054 2048-bit safe prime), **g = 2**.
- Define **`H(·)`** as SHA-256 over deterministic encodings.

---

### Registration (client computes, server stores)

1. Normalize identity: **`I = lower(email)`**
2. Generate random **salt `s`** (bytes)
3. **`x = H(s, H(I ":" p))`**
4. **`v = g^x mod N`**
5. Client → Server: **`I, s, v`** (hex strings)
   Server stores: **`I, s(bytes), v(bytes)`**

---

### Login — Step 1 (Start)

#### Client

1. Random **`a`** (≥ 256 bits)
2. **`A = g^a mod N`**, require **`A % N != 0`**
3. Send **`{ email, A }`** to `/srp-login/start`

#### Server

1. Lookup **`s, v`** for **`I`**
2. Random **`b`** (≥ 256 bits)
3. **`k = H(N, g)`**
4. **`B = (k·v + g^b) mod N`**, reject if **`B % N == 0`**
5. **`u = H(A, B)`**
6. Save session: **`(I, A, B, b, v, u, s)`**
7. Reply:
   ```json
   { "salt": s_hex, "B": B_hex, "session_id": "uuid" }
   ```

```

```

---

### Login — Step 2 (Verify)

#### Client

1. **`x = H(s, H(I ":" p))`**
2. **`S = (B − k·g^x)^(a + u·x) mod N`**
   - Reduce base mod N; ensure non-negative.
3. **`K = H(S)`**
4. **`M1 = H(I, s, A, B, K)`**
5. Send:
   ```json
   { "session_id": "uuid", "email": I, "M1": M1_hex }
   ```

#### Server

1. Load session by **`session_id`**
2. **`S = (A · v^u)^b mod N`**
3. **`K = H(S)`**
4. Verify **`M1 == H(I, s, A, B, K)`**
5. If OK:
   - **`M2 = H(A, M1, K)`**
   - Delete session
   - Respond:
     ```json
     { "message": "Login successful", "M2": M2_hex }
     ```

#### Client (final)

- Verify **`M2 == H(A, M1, K)`** → success.

---

## 9) Quick Recap

- Registration saves **salt + verifier** only (`s`, `v`), with **`x = H(s, H(I ":" p))`** done on the client.
- Login uses **fresh one-time secrets** and **public values** to independently compute the same secret `S`.
- Two short messages (**`M1`**, **`M2`**) confirm both sides agree on **`K`**.
- After SRP, issue a normal app session (JWT/cookie) and proceed as usual.

```

```
