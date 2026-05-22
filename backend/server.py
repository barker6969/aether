from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any

import bcrypt
import jwt as pyjwt
from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
import httpx

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
)

# ────────────────────────────────────────────────────────────────────────────
# Configuration
# ────────────────────────────────────────────────────────────────────────────
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL_MIN = 60 * 24  # 1 day for desktop-app feel
REFRESH_TOKEN_TTL_DAYS = 7
EMERGENT_SESSION_TTL_DAYS = 7

STRIPE_API_KEY = os.environ["STRIPE_API_KEY"]
EMERGENT_SESSION_DATA_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# Server-side fixed pricing — NEVER accept amount from client
PRICING_TIERS = {
    "solo_annual":      {"amount": 89.00,  "label": "Solo Builder Edition (1 year)",   "grant_plan": "solo",             "grant_credits": 50},
    "founding_lifetime": {"amount": 299.00, "label": "Founding Builder · Lifetime",     "grant_plan": "founding_builder", "grant_credits": 500},
    "credits_starter":  {"amount": 19.00,  "label": "Starter · +50 credits",            "grant_plan": None,               "grant_credits": 50},
    "credits_builder":  {"amount": 49.00,  "label": "Builder · +150 credits",           "grant_plan": None,               "grant_credits": 150},
    "credits_workshop": {"amount": 149.00, "label": "Workshop · +500 credits",          "grant_plan": None,               "grant_credits": 500},
    "credits_wholesale":{"amount": 499.00, "label": "Wholesale · +2000 credits",        "grant_plan": None,               "grant_credits": 2000},
}

# MongoDB
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("aether")


# ────────────────────────────────────────────────────────────────────────────
# Models
# ────────────────────────────────────────────────────────────────────────────
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    user_id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    role: str = "user"
    plan: str = "free"
    credits: int = 100
    member_since: str
    provider: str = "email"


class CheckoutCreateRequest(BaseModel):
    tier_id: str
    origin_url: str


# ────────────────────────────────────────────────────────────────────────────
# Password + JWT helpers
# ────────────────────────────────────────────────────────────────────────────
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_TTL_MIN),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_TTL_DAYS),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_jwt_cookies(response: Response, user_id: str, email: str) -> None:
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=ACCESS_TOKEN_TTL_MIN * 60, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=REFRESH_TOKEN_TTL_DAYS * 86400, path="/")


def clear_auth_cookies(response: Response) -> None:
    for c in ("access_token", "refresh_token", "session_token"):
        response.delete_cookie(c, path="/")


def public_user(doc: Dict[str, Any]) -> UserPublic:
    return UserPublic(
        user_id=doc["user_id"],
        email=doc["email"],
        name=doc.get("name"),
        picture=doc.get("picture"),
        role=doc.get("role", "user"),
        plan=doc.get("plan", "free"),
        credits=doc.get("credits", 100),
        provider=doc.get("provider", "email"),
        member_since=(doc.get("created_at") or datetime.now(timezone.utc)).isoformat() if isinstance(doc.get("created_at"), datetime) else (doc.get("created_at") or datetime.now(timezone.utc).isoformat()),
    )


async def _resolve_jwt(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    except pyjwt.PyJWTError:
        return None


async def _resolve_session_token(token: str) -> Optional[Dict[str, Any]]:
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        return None
    exp = sess.get("expires_at")
    if isinstance(exp, str):
        try:
            exp = datetime.fromisoformat(exp)
        except ValueError:
            return None
    if isinstance(exp, datetime):
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            return None
    return await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0, "password_hash": 0})


async def get_current_user(request: Request) -> Dict[str, Any]:
    """Accepts JWT access_token cookie OR Emergent session_token cookie OR bearer header."""
    # 1. JWT access_token cookie
    tok = request.cookies.get("access_token")
    if tok:
        user = await _resolve_jwt(tok)
        if user:
            return user
    # 2. Emergent session_token cookie
    sess = request.cookies.get("session_token")
    if sess:
        user = await _resolve_session_token(sess)
        if user:
            return user
    # 3. Authorization Bearer header (testing)
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        bearer = auth[7:]
        user = await _resolve_jwt(bearer) or await _resolve_session_token(bearer)
        if user:
            return user
    raise HTTPException(status_code=401, detail="Not authenticated")


# ────────────────────────────────────────────────────────────────────────────
# Brute-force lockout helpers
# ────────────────────────────────────────────────────────────────────────────
async def _is_locked(identifier: str) -> bool:
    rec = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if not rec:
        return False
    if rec.get("count", 0) >= 5 and rec.get("locked_until"):
        lu = rec["locked_until"]
        if isinstance(lu, str):
            lu = datetime.fromisoformat(lu)
        if lu.tzinfo is None:
            lu = lu.replace(tzinfo=timezone.utc)
        if lu > datetime.now(timezone.utc):
            return True
    return False


async def _register_failure(identifier: str) -> None:
    rec = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    count = (rec or {}).get("count", 0) + 1
    locked_until = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat() if count >= 5 else None
    await db.login_attempts.update_one(
        {"identifier": identifier},
        {"$set": {"identifier": identifier, "count": count, "locked_until": locked_until}},
        upsert=True,
    )


async def _clear_failures(identifier: str) -> None:
    await db.login_attempts.delete_one({"identifier": identifier})


# ────────────────────────────────────────────────────────────────────────────
# Auth endpoints
# ────────────────────────────────────────────────────────────────────────────
@api_router.post("/auth/signup")
async def signup(payload: SignupRequest, response: Response):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "user_id": user_id,
        "email": email,
        "name": payload.name or email.split("@")[0],
        "picture": None,
        "password_hash": hash_password(payload.password),
        "role": "user",
        "plan": "free",
        "credits": 100,
        "provider": "email",
        "created_at": now,
    }
    await db.users.insert_one(doc)
    set_jwt_cookies(response, user_id, email)
    return public_user(doc)


@api_router.post("/auth/login")
async def login(payload: LoginRequest, request: Request, response: Response):
    email = payload.email.lower().strip()
    ip = request.client.host if request.client else "anon"
    identifier = f"{ip}:{email}"
    if await _is_locked(identifier):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash") or not verify_password(payload.password, user["password_hash"]):
        await _register_failure(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await _clear_failures(identifier)
    set_jwt_cookies(response, user["user_id"], email)
    return public_user(user)


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    # If Emergent session, delete from DB
    st = request.cookies.get("session_token")
    if st:
        await db.user_sessions.delete_one({"session_token": st})
    clear_auth_cookies(response)
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return public_user(user)


@api_router.post("/auth/session")
async def emergent_session_exchange(request: Request, response: Response):
    """Exchange Emergent OAuth session_id for a session_token cookie."""
    body = await request.json()
    session_id = body.get("session_id") if isinstance(body, dict) else None
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.get(EMERGENT_SESSION_DATA_URL, headers={"X-Session-ID": session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = r.json()
    email = (data.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email missing from oauth payload")

    user = await db.users.find_one({"email": email})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": data.get("name") or email.split("@")[0],
            "picture": data.get("picture"),
            "role": "user",
            "plan": "free",
            "credits": 100,
            "provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user_doc)
        user = user_doc
    else:
        # update picture/name if changed
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"name": data.get("name") or user.get("name"), "picture": data.get("picture")}},
        )

    expires_at = (datetime.now(timezone.utc) + timedelta(days=EMERGENT_SESSION_TTL_DAYS)).isoformat()
    await db.user_sessions.insert_one(
        {
            "user_id": user["user_id"],
            "session_token": data["session_token"],
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    response.set_cookie(
        key="session_token",
        value=data["session_token"],
        httponly=True,
        secure=True,
        samesite="none",
        max_age=EMERGENT_SESSION_TTL_DAYS * 86400,
        path="/",
    )
    return public_user(user)


# ────────────────────────────────────────────────────────────────────────────
# Credits / profile helpers
# ────────────────────────────────────────────────────────────────────────────
async def _grant_purchase(user_id: str, tier_id: str) -> None:
    tier = PRICING_TIERS.get(tier_id)
    if not tier:
        return
    update: Dict[str, Any] = {}
    inc: Dict[str, Any] = {}
    if tier["grant_credits"]:
        inc["credits"] = tier["grant_credits"]
    if tier["grant_plan"]:
        update["plan"] = tier["grant_plan"]
        if tier["grant_plan"] == "solo":
            update["license_expires_at"] = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
        elif tier["grant_plan"] == "founding_builder":
            update["license_expires_at"] = None
    op = {}
    if update:
        op["$set"] = update
    if inc:
        op["$inc"] = inc
    if op:
        await db.users.update_one({"user_id": user_id}, op)


# ────────────────────────────────────────────────────────────────────────────
# Stripe Checkout
# ────────────────────────────────────────────────────────────────────────────
@api_router.get("/stripe/pricing")
async def stripe_pricing():
    return {
        "tiers": [
            {"tier_id": k, **v} for k, v in PRICING_TIERS.items()
        ]
    }


@api_router.post("/stripe/checkout")
async def stripe_checkout(payload: CheckoutCreateRequest, request: Request, user=Depends(get_current_user)):
    tier = PRICING_TIERS.get(payload.tier_id)
    if not tier:
        raise HTTPException(status_code=400, detail="Invalid tier")
    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/payment/cancel"
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    req = CheckoutSessionRequest(
        amount=float(tier["amount"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"tier_id": payload.tier_id, "user_id": user["user_id"]},
    )
    session = await sc.create_checkout_session(req)
    await db.payment_transactions.insert_one(
        {
            "session_id": session.session_id,
            "user_id": user["user_id"],
            "user_email": user["email"],
            "tier_id": payload.tier_id,
            "amount": float(tier["amount"]),
            "currency": "usd",
            "status": "initiated",
            "payment_status": "pending",
            "metadata": {"tier_id": payload.tier_id, "user_id": user["user_id"]},
            "created_at": datetime.now(timezone.utc).isoformat(),
            "fulfilled": False,
        }
    )
    return {"url": session.url, "session_id": session.session_id}


@api_router.get("/stripe/status/{session_id}")
async def stripe_status(session_id: str, request: Request, user=Depends(get_current_user)):
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your transaction")
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    s = await sc.get_checkout_status(session_id)
    new_payment_status = s.payment_status
    new_status = s.status
    # Idempotent fulfillment
    if not txn.get("fulfilled") and new_payment_status == "paid":
        await _grant_purchase(user["user_id"], txn["tier_id"])
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": new_status, "payment_status": new_payment_status, "fulfilled": True}},
        )
    elif txn.get("payment_status") != new_payment_status or txn.get("status") != new_status:
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": new_status, "payment_status": new_payment_status}},
        )
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return {
        "status": new_status,
        "payment_status": new_payment_status,
        "amount_total": s.amount_total,
        "currency": s.currency,
        "user": public_user(updated_user) if updated_user else None,
    }


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    try:
        evt = await sc.handle_webhook(body, sig)
    except Exception as e:
        logger.warning(f"Stripe webhook parse failed: {e}")
        return JSONResponse(status_code=200, content={"received": True})
    if evt.payment_status == "paid":
        txn = await db.payment_transactions.find_one({"session_id": evt.session_id}, {"_id": 0})
        if txn and not txn.get("fulfilled"):
            await _grant_purchase(txn["user_id"], txn["tier_id"])
            await db.payment_transactions.update_one(
                {"session_id": evt.session_id},
                {"$set": {"status": "complete", "payment_status": "paid", "fulfilled": True}},
            )
    return {"received": True}


# ────────────────────────────────────────────────────────────────────────────
# Misc routes
# ────────────────────────────────────────────────────────────────────────────
@api_router.get("/")
async def root():
    return {"message": "Aether API online", "version": "4.7.2"}


# ────────────────────────────────────────────────────────────────────────────
# Startup
# ────────────────────────────────────────────────────────────────────────────
async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@aether.dev").lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one(
            {
                "user_id": f"user_{uuid.uuid4().hex[:12]}",
                "email": admin_email,
                "name": "Aether Admin",
                "picture": None,
                "password_hash": hash_password(admin_pw),
                "role": "admin",
                "plan": "founding_builder",
                "credits": 5000,
                "provider": "email",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        logger.info(f"Seeded admin user: {admin_email}")
    elif not verify_password(admin_pw, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_pw)}})
        logger.info("Updated admin password to .env value")


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.payment_transactions.create_index("session_id", unique=True)
    await seed_admin()
    logger.info("Aether backend startup complete")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# CORS — credentials require explicit origin list. Allow any preview/origin via regex.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
