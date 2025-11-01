import hashlib
import time, secrets, uuid
from typing import Dict, Optional

# A large modulus N written in hex. In SRP/Diffie-Hellman-style protocols,
# N is (ideally) a "safe" large prime used as the finite cyclic group modulus.
# Using a large N makes discrete log problems intractable, which underpins the
# security of the protocol. This particular value resembles a custom large prime.
N_hex = (
    "AC6BDB41324A9A9BF166DE5E1389582FAF72B6651987EE07"
    "FC3192943DB56050A37329CBB4A099ED8193E0757767A13D"
    "D52312AB4B03310DCD7F48A9DA04FD50E8083969EDB767B0"
    "CF6096F3C0D8D6E9C1F8F8A0E4C8E88C6A1A2F6D1C6D3C6A"
    "62D508F57DBF9BD3B0A6BBE117577A615D6C770988C0BAD9"
    "C0C3D29E5309CDA79B846D1C50E55B2DD81A6FA6D58EBB10"
    "BF3A8A94A57F9F3F8E2BFA3C4A776C9A72F1"
)
# Convert the hex string into an integer we can do math with.
N = int(N_hex, 16)

# g is the generator (base) for the multiplicative group modulo N.
# A small generator like 2 is standard and simplifies implementations.
g = int("02", 16)

# Number of bytes required to represent N. This is used to pad values to a fixed width
# when hashing, ensuring consistent encodings and preventing ambiguity (a must in crypto).
N_BYTES = (N.bit_length() + 7) // 8


def PAD(x_int: int) -> bytes:
    """
    Convert an integer to a big-endian, fixed-length byte string of length N_BYTES.

    Why: In cryptographic protocols, all integers are encoded at a fixed width to avoid
    ambiguity and length-leakage. Padding to N_BYTES ensures that different integers
    occupying fewer bytes are still hashed consistently with the same field size.
    """
    if x_int < 0:
        raise ValueError("negative int for PAD")

    # Convert to big-endian bytes in the minimal length needed.
    b = x_int.to_bytes(N_BYTES, "big")

    # Defensive: If for some reason the produced bytes aren't N_BYTES long,
    # left-pad with zeros to reach the fixed width. (Usually to_bytes with
    # length=N_BYTES already guarantees this, but this guard makes intent clear.)
    if len(b) != N_BYTES:
        b = (b"\x00" * (N_BYTES - len(b))) + b
    return b


def H(*parts) -> int:
    """
    Hash a sequence of parts with SHA-256 and return the result as an integer.

    Accepts ints (padded to N_BYTES), bytes, or strings (UTF-8). Mixing types is common
    in crypto transcripts. Returning an int is convenient when the hash is later used
    in modular arithmetic.

    Why SHA-256: A widely trusted, collision-resistant hash with constant-time behavior
    for fixed-size inputs. Using a single, consistent hash function keeps protocol
    derivations coherent.
    """
    sha = hashlib.sha256()

    for a in parts:
        if isinstance(a, int):
            # Integers are normalized to fixed-width encodings
            # so that participants hash *exactly* the same bytes.
            sha.update(PAD(a))
        elif isinstance(a, bytes):
            sha.update(a)
        elif isinstance(a, str):
            sha.update(a.encode("utf-8"))
        else:
            raise TypeError(f"Unsupported type: {type(a)}")

    # Return the digest as a big-endian integer for easier math later.
    return int.from_bytes(sha.digest(), "big")


def hex64_from_int(x: int) -> str:
    """
    Format an integer as a 64-hex-character lowercase string (256 bits).

    Why: Useful for logging, debugging, or producing fixed-width IDs/keys
    without leaking leading-zero length differences.
    """
    return format(x, "064x")



# Sessions expire after 300 seconds (5 minutes).
SESSION_TIMEOUT = 300

# active_sessions maps a session_id (UUID string) to a session dict that at least
# contains 'created_at' (epoch seconds) and any state you choose to store.
active_sessions: Dict[str, Dict] = {}


def new_session(state: Dict) -> str:
    """
    Create a new session with a unique ID and attach a creation timestamp.

    Why: Short-lived sessions let you carry protocol state (e.g., nonces,
    partial computations) across multiple HTTP requests safely and expire them
    to limit replay windows and memory usage.
    """
    # UUIDv4 provides a sufficiently unique, non-guessable session key for most uses.
    sid = str(uuid.uuid4())
    state["created_at"] = time.time()
    active_sessions[sid] = state
    return sid


def get_session(session_id: str) -> Optional[Dict]:
    """
    Fetch a session by ID without removing it.

    Why: Read current state mid-protocol (e.g., to verify a step or continue the flow).
    """
    return active_sessions.get(session_id)


def pop_session(session_id: str) -> Optional[Dict]:
    """
    Atomically fetch and remove a session.

    Why: One-time use sessions (like single-use challenges) should be invalidated
    as soon as they're consumed to prevent replay.
    """
    return active_sessions.pop(session_id, None)


def clean_expired_sessions():
    """
    Remove sessions older than SESSION_TIMEOUT.

    Why: Limits memory growth and reduces the attack window for replaying stale
    protocol messages tied to old sessions.
    """
    now = time.time()
    # Identify sessions whose age exceeds the timeout.
    expired = [sid for sid, s in active_sessions.items() if now - s["created_at"] > SESSION_TIMEOUT]
    # Delete them if present (pop with default None is safe even if already removed).
    for sid in expired:
        active_sessions.pop(sid, None)


def randbits_256() -> int:
    """
    Return a cryptographically secure 256-bit random integer.

    Why: Use for nonces, private exponents, salts, or secret keys. The 'secrets'
    module draws from the OS CSPRNG, which is appropriate for security-sensitive use.
    """
    return secrets.randbits(256)
