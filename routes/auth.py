from flask import Blueprint, request, jsonify, make_response
from database.auth import register_srp_user, get_user_salt_verifier, get_user_email
from utils.srpUtils import N, g, H, hex64_from_int,  new_session, clean_expired_sessions,get_session, pop_session, randbits_256
from utils.jwt_helper import create_jwt_token, verify_jwt_token
import jwt 
import os
from datetime import datetime, timedelta, timezone
from database.get_roles import get_all_roles_db
# -----------------------------
# WHAT IS SRP?
# -----------------------------
# SRP (Secure Remote Password, RFC 5054) is a password-authenticated key exchange (PAKE).
# Goal: Prove a client knows a user’s password to the server and establish a shared session key,
# *without ever sending the password to the server* and *without the server needing to store the password*.
#
# Key ideas:
# - During registration, the server stores a "verifier" v derived from the password, plus a random salt s.
#   v = g^x mod N, where x = H(s | username | password)    (common scheme; this code expects the client to compute verifier).
# - At login, the client generates an ephemeral A and the server generates an ephemeral B.
#   Both sides compute the same shared secret S using different formulas; then hash S to get K (session key).
# - The client proves knowledge by sending M1 (a hash over context and K). The server responds with M2.
# - If M1 and M2 match the server’s and client’s expectations, both sides are sure the other knows the password-derived secret.
#
# Security benefits:
# - The server never sees the raw password and stores only a salt+verifier. A DB leak doesn’t immediately reveal passwords.
# - Active and passive eavesdroppers can’t recover the password or the session key.
# - The "scrambling parameter" u prevents manipulation of A/B in a way that would enable offline guessing.



# ─────────────────────────────────────────────────────────────────────────────
# SRP quick glossary (used below in comments)
# N: large safe prime (RFC 5054 group). Modulus for all operations.
# g: generator for multiplicative subgroup modulo N.
# s (salt): random bytes; prevents precomputation/rainbow table attacks.
# x: H(s | username | password) — "password exponent" derived from the secret.
# v: g^x mod N — verifier stored on server instead of password.
# a, b: client/server ephemeral secrets (fresh random per login).
# A = g^a mod N: client ephemeral public (sent by client).
# B = (k*v + g^b) mod N: server ephemeral public (sent by server).
# k = H(N | g): "multiplier" to mix in params/verifier into B (SRP-6a).
# u = H(A | B): "scrambling" parameter; binds A with B and thwarts offline attacks.
# S: shared secret (different formulas client/server) but equal in the end.
# K = H(S): session key derived from S (never sent).
# M1: client proof = H(email | salt | A | B | K).
# M2: server proof = H(A | M1 | K).
# ─────────────────────────────────────────────────────────────────────────────



# /srp-register — Client sends salt/verifier created from password locally   
# FRONTEND sends JSON:                                                       
# { full_name, email, salt: hex, verifier: hex }                             
# BACKEND stores BYTEA salt/verifier; never sees password.                   

bp = Blueprint("auth", __name__)  

@bp.route('/srp-register', methods=['POST'])
def srp_register():
    """
    Registration flow (SRP):
      - Frontend generates random salt s (bytes).
      - Frontend computes x = H(s | email | password).
      - Frontend computes v = g^x mod N.
      - Frontend sends s (hex), v (hex). Server stores them as BYTEA.
    """
    data = request.get_json() or {}
    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    salt_hex = (data.get("salt") or "").strip().lower()         
    verifier_hex = (data.get("verifier") or "").strip().lower() 

    # Ensure all are present; otherwise SRP math will be meaningless.
    if not all([full_name, email, salt_hex, verifier_hex]):
        return jsonify({"error": "Missing fields"}), 400

    # Check if email already exists
    existing_user = get_user_email(email)
    if existing_user:
        return jsonify({"error": "That email is already in use. Try logging in instead."}), 400

    try:
        # Persist as BYTEA (psycopg2 wants bytes)
        salt_bytes = bytes.fromhex(salt_hex)
        verifier_bytes = bytes.fromhex(verifier_hex)
    except ValueError:
        return jsonify({"error": "Bad hex for salt/verifier"}), 400

    # Insert via DB helper.
    result, status = register_srp_user(full_name, email, salt_bytes, verifier_bytes)
    return jsonify(result), status


# 
#  /srp-login/start — Begin handshake                                         
#  FRONTEND sends JSON: { email, A: hex }                                     
#  BACKEND returns: { salt: hex, B: hex, session_id }                         
#  Frontend will use these to compute S, K, and M1.                           
# 

@bp.route("/srp-login/start", methods=["POST"])
def srp_login_start():
    """
    Step 1 (Client → Server):
      - Client picks random a (>=256 bits) and sends A = g^a mod N (hex).
      - Server looks up (salt, v) for user, picks random b, computes:
          k = H(N,g)
          B = (k*v + g^b) mod N
          u = H(A, B)
        and returns { salt, B, session_id }.

    Why we compute these:
      - A: fresh client ephemeral; changes every login (prevents replay).
      - k: binds params so B "includes" verifier (SRP-6a).
      - B: server ephemeral tied to verifier; without correct v, S won't match.
      - u: scrambler that prevents offline dictionary attacks against v.
      - session_id: binds this "start" step to the "verify" step (HTTP is stateless).
    """
    # Clean old sessions to reduce replay windows & memory growth
    clean_expired_sessions()

    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    A_hex = (data.get("A") or "").strip().lower()

    if not email or not A_hex:
        return jsonify({"error": "Missing email or A"}), 400

    # Convert A (hex → int). A is g^a mod N computed on the client.
    try:
        A = int(A_hex, 16)
    except Exception:
        return jsonify({"error": "Invalid A"}), 400

    # SRP safety check: A must be a valid group element (not 0 mod N).
    if A % N == 0:
        return jsonify({"error": "Invalid A (mod N == 0)"}), 400

    # Pull (salt, verifier) from DB. Both stored as BYTEA.
    user = get_user_salt_verifier(email)
    if not user:
        return jsonify({"error": "No account found with the provided information."}), 404

    # psycopg2 returns BYTEA as memoryview — normalize to bytes
    salt_val = user["salt"]
    verifier_val = user["verifier"]
    salt_bytes = salt_val.tobytes() if isinstance(salt_val, memoryview) else bytes(salt_val)
    verifier_bytes = verifier_val.tobytes() if isinstance(verifier_val, memoryview) else bytes(verifier_val)

    # Convert verifier (bytes) → int (needed for modular exponentiation)
    v = int.from_bytes(verifier_bytes, "big")

    # k mixes N and g; part of SRP-6a hardening. Prevents chosen-subgroup tricks.
    k = H(N, g)

    # Server picks fresh b (>=256-bit) and publishes B based on both g^b and v.
    b = randbits_256()
    B = (k * v + pow(g, b, N)) % N

    # Safety: B must also be a valid group element.
    if B % N == 0:
        return jsonify({"error": "Invalid B (mod N == 0)"}), 400

    # Scrambling parameter: couples A and B to block offline guessing attacks.
    u = H(A, B)

    # Save only what we'll need to validate M1 in step 2 (keep state minimal).
    # NOTE: new_session returns a generated session_id and stores the dict by id.
    session_id = new_session({
        "email": email,
        "A": A,
        "B": B,
        "b": b,
        "v": v,
        "u": u,
        "salt": salt_bytes,
    })

    # Client needs salt (to recompute x), B (to compute S), and session_id (to bind step 2).
    return jsonify({
        "salt": salt_bytes.hex(),
        "B": format(B, "x"),
        "session_id": session_id
    })


# 
#  /srp-login/verify — Client proves knowledge of password                    
#  FRONTEND sends JSON: { session_id, email, M1: hex }                        
#  BACKEND returns JSON: { message, M2: hex }                                 
#  Client checks M2 locally to authenticate the server (mutual auth).         
# 



@bp.route("/srp-login/verify", methods=["POST"])
def srp_login_verify():
    """
    Step 2 (Client → Server):
      - Client uses salt, B, and its (a, password) to compute:
          u = H(A, B)
          x = H(s | email | password)
          S = (B - k*g^x)^(a + u*x) mod N
          K = H(S)
          M1 = H(email | s | A | B | K)
        and sends M1.

      - Server recomputes:
          S = (A * v^u)^b mod N
          K = H(S)
          expected_M1 = H(email | s | A | B | K)

        If equal, server sends M2 = H(A | M1 | K) so client can authenticate server.

    Why these values:
      - S depends on both sides’ secrets (a, b) and registered v (password-derived).
      - K is the final session key (never sent); both sides derive the same K.
      - M1 proves the client knew the password-derived x (without sending it).
      - M2 proves the server computed the same K (mutual authentication).
    """
    data = request.get_json() or {}

    session_id = data.get("session_id")
    email = (data.get("email") or "").strip().lower()
    client_M1_hex = (data.get("M1") or "").strip().lower()

    # Retrieve the ephemeral state from step 1 (bound by session_id).
    session = get_session(session_id)
    if not session:
        return jsonify({"error": "Session expired or invalid"}), 400

    # Pull the server-side values we need to recompute S and expected M1.
    A = session["A"]
    B = session["B"]
    b = session["b"]
    v = session["v"]
    u = session["u"]
    salt_bytes = session["salt"]

    # Server-side S formula (different from client's but yields same value):
    #   Avu = (A * v^u) mod N
    #   S   = (Avu)^b      mod N
    Avu = (A * pow(v, u, N)) % N
    S = pow(Avu, b, N)

    # Derive K (int form via H); never transmitted.
    K_int = H(S)

    # Expected client proof M1 must match client's M1 if passwords match.
    expected_M1_int = H(email, salt_bytes, A, B, K_int)

    # Parse client's M1 (hex → int) for comparison.
    try:
        client_M1_int = int(client_M1_hex, 16)
    except Exception:
        # Bad input: ditch the session to prevent reuse.
        pop_session(session_id)
        return jsonify({"error": "Bad M1"}), 400

    # If proofs mismatch, either password is wrong or tampering occurred.
    if expected_M1_int != client_M1_int:
        pop_session(session_id)
        return jsonify({"error": "Invalid email or password."}), 403

    # Server proof lets the client verify the server also computed K (mutual auth).
    M2_int = H(A, client_M1_int, K_int)
    M2_hex = hex64_from_int(M2_int)

    # One-time handshake: destroy the session to block replays.
    pop_session(session_id)

    get_user_id = get_user_email(email)

    access_token = create_jwt_token(
        {"email": email, "id": get_user_id["id"], "app_role_id" : get_user_id["app_role_id"], "full_name": get_user_id["full_name"], "type": "access"},
        expires_in_seconds=20
 
    )

    refresh_token = create_jwt_token(
        {"email": email, "id": get_user_id["id"],"full_name": get_user_id["full_name"],  "type": "refresh"},
        expires_in_seconds=3 * 60 * 60
    )

    response = make_response(jsonify({
        "message": "Login successful",
        "M2": M2_hex
    }))

    env = (os.getenv("APP_ENV") or "local").lower()

    if env == "local":
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="None",

            max_age=15 * 60
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="None",

            max_age=3 * 60 * 60
        )
    else:
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            domain=".tavolopro.live",
            max_age=15 * 60
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="None",
            domain=".tavolopro.live",
            max_age=3 * 60 * 60
        )


    return response

@bp.route("/protected", methods=["GET"])
def check_auth():
    access_token = request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")

    def load_roles():
        roles, status = get_all_roles_db()
        return roles if status == 200 else []

    if access_token:
        decoded = verify_jwt_token(access_token)
        if "error" not in decoded:
            roles = load_roles()
            return jsonify({
                "authenticated": True,
                "user": decoded,
                "app-roles": roles
            }), 200

    if refresh_token:
        decoded_refresh = verify_jwt_token(refresh_token, is_refresh=True)
        if "error" not in decoded_refresh:
            roles = load_roles()
            return jsonify({
                "authenticated": True,
                "user": decoded_refresh,
                "app-roles": roles
            }), 200

    return jsonify({"authenticated": False, "error": "Unauthorized"}), 401


@bp.route("/logout", methods=["POST"])
def logout():
    """
    Logs out the user by clearing both access and refresh tokens.
    """
    response = make_response(jsonify({"message": "Successfully logged out"}))

    # Remove both cookies by setting them to empty with max_age=0
    response.set_cookie(
        key="access_token",
        value="",
        httponly=True,
        secure=True,
        samesite="none",
        max_age=0
    )

    response.set_cookie(
        key="refresh_token",
        value="",
        httponly=True,
        secure=True,
        samesite="none",
        max_age=0
    )

    return response, 200