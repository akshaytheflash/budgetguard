from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import sqlite3
import hashlib
import secrets
from contextlib import contextmanager
import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables (for local dev)
load_dotenv()

app = FastAPI(title="BudgetGuard API v2")

# Configure Gemini API
# On Vercel, this will come from environment variables
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("⚠️ Warning: GEMINI_API_KEY not found in environment variables")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
import os
import shutil

# Database setup
# On Vercel, we can only write to /tmp.
# We check if we are on Vercel (or just use /tmp by default for cloud deploy)
if os.environ.get("VERCEL") or not os.access(".", os.W_OK):
    DB_PATH = "/tmp/budgetguard.db"
else:
    DB_PATH = "budgetguard.db"

# Helper to ensure DB exists in /tmp if needed
def ensure_db_exists():
    if DB_PATH.startswith("/tmp") and not os.path.exists(DB_PATH):
        # If we have a local seed file, copy it
        if os.path.exists("budgetguard.db"):
            shutil.copy2("budgetguard.db", DB_PATH)
        else:
            # Otherwise allow init_db to create it
            pass

ensure_db_exists()

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT,
                phone TEXT,
                password_hash TEXT NOT NULL,
                monthly_budget REAL DEFAULT 0,
                emergency_fund REAL DEFAULT 0,
                emergency_pin TEXT,
                is_premium INTEGER DEFAULT 0,
                coin_balance INTEGER DEFAULT 0,
                current_streak INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                total_trees_planted INTEGER DEFAULT 0,
                tree_progress INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Transactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                description TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                is_useful INTEGER DEFAULT NULL,
                is_verified INTEGER DEFAULT 1,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Streak history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS streak_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                has_savings INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(user_id, date)
            )
        """)
        
        # Scam detection history
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scam_checks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                message_text TEXT NOT NULL,
                risk_score REAL,
                risk_level TEXT,
                explanation TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Coin redemptions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS coin_redemptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                brand TEXT NOT NULL,
                coins_spent INTEGER NOT NULL,
                redemption_code TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        conn.commit()

# Initialize database on startup
init_db()

# Pydantic models
class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class SetBudgetRequest(BaseModel):
    monthly_budget: float
    emergency_fund: float
    emergency_pin: Optional[str] = None

class AddTransactionRequest(BaseModel):
    amount: float
    description: str
    category: Optional[str] = "general"
    is_verified: Optional[bool] = True

class MarkTransactionRequest(BaseModel):
    transaction_id: int
    is_useful: bool

class SimulatePaymentRequest(BaseModel):
    amount: float
    description: str
    use_emergency: bool = False
    emergency_pin: Optional[str] = None

class ScamCheckRequest(BaseModel):
    message_text: str

class RedeemCoinsRequest(BaseModel):
    brand: str
    coins_required: int


# Helper functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO sessions (user_id, token) VALUES (?, ?)", (user_id, token))
        conn.commit()
    return token

def get_user_from_token(token: str) -> Optional[dict]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.* FROM users u
            JOIN sessions s ON u.id = s.user_id
            WHERE s.token = ?
        """, (token,))
        row = cursor.fetchone()
        return dict(row) if row else None

def update_streak_and_trees(user_id: int):
    """Update user's streak and tree progress based on daily verified transactions"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get today's date
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Check if user has a verified transaction today
        cursor.execute("""
            SELECT COUNT(*) FROM transactions
            WHERE user_id = ? AND DATE(timestamp) = ? AND is_verified = 1
        """, (user_id, today))
        
        has_transaction_today = cursor.fetchone()[0] > 0
        
        # Update or insert streak history for today
        cursor.execute("""
            INSERT OR REPLACE INTO streak_history (user_id, date, has_savings)
            VALUES (?, ?, ?)
        """, (user_id, today, 1 if has_transaction_today else 0))
        
        # Calculate current streak
        cursor.execute("""
            SELECT date FROM streak_history
            WHERE user_id = ? AND has_savings = 1
            ORDER BY date DESC
        """, (user_id,))
        
        dates = [row[0] for row in cursor.fetchall()]
        current_streak = 0
        
        if dates:
            # Count consecutive days from today backwards
            current_date = datetime.now()
            for date_str in dates:
                date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                if (current_date - date_obj).days == current_streak:
                    current_streak += 1
                else:
                    break
        
        # Get current user data
        cursor.execute("SELECT longest_streak, tree_progress, total_trees_planted FROM users WHERE id = ?", (user_id,))
        user_data = cursor.fetchone()
        longest_streak = max(current_streak, user_data[0] if user_data else 0)
        tree_progress = user_data[1] if user_data else 0
        total_trees = user_data[2] if user_data else 0
        
        # Update tree progress (every 7 consecutive days = 1 tree)
        if current_streak > 0 and current_streak % 7 == 0 and current_streak > tree_progress:
            tree_progress = current_streak
            total_trees += 1
        
        # Calculate tree progress within current cycle (0-6)
        tree_progress_display = current_streak % 7
        
        # Update user
        cursor.execute("""
            UPDATE users 
            SET current_streak = ?, longest_streak = ?, tree_progress = ?, total_trees_planted = ?
            WHERE id = ?
        """, (current_streak, longest_streak, tree_progress_display, total_trees, user_id))
        
        conn.commit()
        
        return current_streak, tree_progress_display, total_trees

def award_coins(user_id: int, amount: int = 1):
    """Award coins to user for verified transactions"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users SET coin_balance = coin_balance + ?
            WHERE id = ?
        """, (amount, user_id))
        conn.commit()

# API Endpoints
@app.post("/register")
async def register(request: RegisterRequest):
    """Register a new user"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if username exists
        cursor.execute("SELECT id FROM users WHERE username = ?", (request.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists")
        
        # Create user
        password_hash = hash_password(request.password)
        cursor.execute(
            "INSERT INTO users (username, email, phone, password_hash) VALUES (?, ?, ?, ?)",
            (request.username, request.email, request.phone, password_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
        
        # Create session
        token = create_session(user_id)
        
        return {
            "message": "User registered successfully",
            "token": token,
            "username": request.username
        }

@app.post("/login")
async def login(request: LoginRequest):
    """Login user"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Find user
        cursor.execute(
            "SELECT * FROM users WHERE username = ?",
            (request.username,)
        )
        user = cursor.fetchone()
        
        if not user or dict(user)['password_hash'] != hash_password(request.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create session
        token = create_session(dict(user)['id'])
        
        return {
            "message": "Login successful",
            "token": token,
            "username": request.username,
            "has_budget": dict(user)['monthly_budget'] > 0
        }

@app.post("/logout")
async def logout(token: str):
    """Logout user"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
    return {"message": "Logged out successfully"}

@app.post("/set_budget")
async def set_budget(request: SetBudgetRequest, token: str):
    """Set monthly budget and emergency fund"""
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users 
            SET monthly_budget = ?, emergency_fund = ?, emergency_pin = ?
            WHERE id = ?
        """, (request.monthly_budget, request.emergency_fund, request.emergency_pin, user['id']))
        conn.commit()
    
    return {
        "message": "Budget updated",
        "monthly_budget": request.monthly_budget,
        "emergency_fund": request.emergency_fund
    }

@app.post("/add_transaction")
async def add_transaction(request: AddTransactionRequest, token: str, emergency_pin: Optional[str] = None):
    """Add a transaction"""
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Check if this transaction requires emergency PIN
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE user_id = ?
            AND strftime('%Y-%m', timestamp) = strftime('%Y-%m', 'now')
        """, (user['id'],))
        current_spend = cursor.fetchone()[0]
    
    predicted_spend = current_spend + request.amount
    safe_limit = user['monthly_budget'] - user['emergency_fund']
    
    # If entering emergency zone, require PIN
    if predicted_spend > safe_limit and user['emergency_fund'] > 0:
        if not emergency_pin or emergency_pin != user['emergency_pin']:
            raise HTTPException(
                status_code=403, 
                detail=f"Emergency PIN required to approve ${request.amount:.2f} transaction (over safe spending limit)."
            )
    
    # Add transaction
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO transactions (user_id, amount, description, category, is_verified)
            VALUES (?, ?, ?, ?, ?)
        """, (user['id'], request.amount, request.description, request.category, 1 if request.is_verified else 0))
        conn.commit()
        txn_id = cursor.lastrowid
    
    # Award coins and update streaks for verified transactions
    if request.is_verified:
        award_coins(user['id'], 1)
        update_streak_and_trees(user['id'])
    
    return {
        "message": "Transaction added",
        "transaction_id": txn_id,
        "coins_earned": 1 if request.is_verified else 0
    }

@app.post("/mark_transaction")
async def mark_transaction(request: MarkTransactionRequest, token: str):
    """Mark transaction as useful or useless"""
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE transactions 
            SET is_useful = ?
            WHERE id = ? AND user_id = ?
        """, (1 if request.is_useful else 0, request.transaction_id, user['id']))
        conn.commit()
    
    return {"message": "Transaction marked"}

@app.get("/dashboard")
async def get_dashboard(token: str):
    """Get user dashboard data"""
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Update streaks first
    update_streak_and_trees(user['id'])
    
    # Refresh user data
    user = get_user_from_token(token)
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get current month transactions
        cursor.execute("""
            SELECT * FROM transactions
            WHERE user_id = ?
            AND strftime('%Y-%m', timestamp) = strftime('%Y-%m', 'now')
            ORDER BY timestamp ASC
        """, (user['id'],))
        
        transactions = []
        cumulative_spend = 0
        chart_data = []
        category_totals = {}
        
        for row in cursor.fetchall():
            txn = dict(row)
            cumulative_spend += txn['amount']
            
            # Category breakdown
            category = txn['category'] or 'general'
            category_totals[category] = category_totals.get(category, 0) + txn['amount']
            
            transactions.append({
                "id": txn['id'],
                "amount": txn['amount'],
                "description": txn['description'],
                "category": txn['category'],
                "is_useful": txn['is_useful'],
                "is_verified": txn['is_verified'],
                "timestamp": txn['timestamp']
            })
            
            # Add to chart data (cumulative)
            chart_data.append({
                "timestamp": txn['timestamp'],
                "amount": cumulative_spend,
                "transaction_id": txn['id']
            })
        
        # Calculate analytics
        now = datetime.now()
        days_in_month = (datetime(now.year, now.month + 1, 1) - timedelta(days=1)).day if now.month < 12 else 31
        days_passed = now.day
        
        avg_daily = cumulative_spend / days_passed if days_passed > 0 else 0
        avg_weekly = avg_daily * 7
        predicted_monthly = avg_daily * days_in_month
        
        # Get heatmap data (last 365 days)
        cursor.execute("""
            SELECT date, has_savings FROM streak_history
            WHERE user_id = ?
            AND date >= date('now', '-365 days')
            ORDER BY date ASC
        """, (user['id'],))
        
        heatmap_data = [{"date": row[0], "count": row[1]} for row in cursor.fetchall()]
        
        budget_remaining = user['monthly_budget'] - cumulative_spend
        budget_usage = (cumulative_spend / user['monthly_budget'] * 100) if user['monthly_budget'] > 0 else 0
        
        return {
            "username": user['username'],
            "monthly_budget": user['monthly_budget'],
            "emergency_fund": user['emergency_fund'],
            "current_spend": round(cumulative_spend, 2),
            "budget_remaining": round(budget_remaining, 2),
            "budget_usage_percent": round(budget_usage, 1),
            "transactions": transactions,
            "chart_data": chart_data,
            
            # New features
            "coin_balance": user['coin_balance'],
            "current_streak": user['current_streak'],
            "longest_streak": user['longest_streak'],
            "tree_progress": user['tree_progress'],
            "total_trees_planted": user['total_trees_planted'],
            "is_premium": user['is_premium'] == 1,
            
            # Analytics
            "analytics": {
                "avg_daily": round(avg_daily, 2),
                "avg_weekly": round(avg_weekly, 2),
                "predicted_monthly": round(predicted_monthly, 2),
                "days_passed": days_passed,
                "days_in_month": days_in_month,
                "category_breakdown": [
                    {"category": cat, "amount": amt, "percentage": round((amt / cumulative_spend * 100) if cumulative_spend > 0 else 0, 1)}
                    for cat, amt in category_totals.items()
                ]
            },
            
            # Heatmap for streak visualization
            "heatmap_data": heatmap_data
        }

@app.post("/simulate_payment")
async def simulate_payment(request: SimulatePaymentRequest, token: str):
    """Simulate payment with ML prediction"""
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Get current spend
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE user_id = ?
            AND strftime('%Y-%m', timestamp) = strftime('%Y-%m', 'now')
        """, (user['id'],))
        current_spend = cursor.fetchone()[0]
    
    predicted_spend = current_spend + request.amount
    budget_usage = (predicted_spend / user['monthly_budget'] * 100) if user['monthly_budget'] > 0 else 0
    
    # Calculate the safe spending limit (budget - emergency fund)
    safe_limit = user['monthly_budget'] - user['emergency_fund']
    emergency_zone = predicted_spend > safe_limit
    overage = max(0, predicted_spend - user['monthly_budget'])
    
    # Determine decision
    # If spending enters emergency zone (exceeds budget - emergency_fund), require PIN
    if emergency_zone and user['emergency_fund'] > 0:
        if request.use_emergency:
            if request.emergency_pin != user['emergency_pin']:
                raise HTTPException(status_code=403, detail="Invalid emergency PIN")
            decision = "SAFE"
            reason = "Approved using emergency fund protection"
            requires_pin = False
        else:
            decision = "BLOCKED"
            reason = f"Emergency PIN required to approve ${request.amount:.2f} payment (over safe spending limit)."
            requires_pin = True
    elif budget_usage >= 100:
        # Exceeds budget completely with no emergency fund
        decision = "BLOCKED"
        reason = f"Predicted spending (${predicted_spend:.2f}) exceeds monthly budget by ${overage:.2f}"
        requires_pin = False
    elif budget_usage >= 85:
        decision = "WARNING"
        reason = f"This payment may push you to {budget_usage:.1f}% of budget"
        requires_pin = False
    else:
        decision = "SAFE"
        reason = "Payment is within safe spending limits"
        requires_pin = False
    
    return {
        "decision": decision,
        "predicted_spend": round(predicted_spend, 2),
        "current_spend": round(current_spend, 2),
        "budget_remaining": round(user['monthly_budget'] - predicted_spend, 2),
        "budget_usage_percent": round(budget_usage, 1),
        "explanation": reason,
        "requires_pin": requires_pin,
        "can_approve": decision == "SAFE"
    }

@app.post("/check_scam")
async def check_scam(request: ScamCheckRequest, token: str):
    """Check if a message is a scam using Gemini API"""
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    print(f"\n{'='*60}")
    print(f"🔍 SCAM CHECK REQUEST")
    print(f"{'='*60}")
    print(f"Message: {request.message_text[:100]}...")
    
    try:
        # Use Gemini API for scam detection
        print("📡 Calling Gemini API with model: gemma-3-27b-it")
        model = genai.GenerativeModel('gemma-3-27b-it')
        
        prompt = f"""Analyze the following message and determine if it's a scam or phishing attempt.
        
Message: "{request.message_text}"
        
Provide your analysis in the following format:
Risk Score: [0-100]
Risk Level: [LOW/MEDIUM/HIGH]
Explanation: [Brief explanation of why this message is or isn't a scam]
        
Be concise and focus on specific red flags or safety indicators."""
        
        response = model.generate_content(prompt)
        response_text = response.text
        
        print(f"✅ Gemini API Response:")
        print(f"{response_text}")
        print(f"{'='*60}\n")
        
        # Parse the response
        risk_score = 0
        risk_level = "LOW"
        explanation = response_text
        
        # Extract risk score
        if "Risk Score:" in response_text:
            try:
                score_line = [line for line in response_text.split('\n') if 'Risk Score:' in line][0]
                risk_score = int(''.join(filter(str.isdigit, score_line)))
                risk_score = min(max(risk_score, 0), 100)  # Clamp between 0-100
            except:
                risk_score = 50  # Default to medium if parsing fails
        
        # Extract risk level
        if "Risk Level:" in response_text:
            try:
                level_line = [line for line in response_text.split('\n') if 'Risk Level:' in line][0]
                if "HIGH" in level_line.upper():
                    risk_level = "HIGH"
                elif "MEDIUM" in level_line.upper():
                    risk_level = "MEDIUM"
                else:
                    risk_level = "LOW"
            except:
                pass
        
        # Extract explanation
        if "Explanation:" in response_text:
            try:
                explanation_parts = response_text.split('Explanation:', 1)
                if len(explanation_parts) > 1:
                    explanation = explanation_parts[1].strip()
            except:
                pass
        
    except Exception as e:
        # Fallback to keyword-based detection if API fails
        print(f"❌ Gemini API Error: {str(e)}")
        print(f"⚠️  Falling back to keyword-based detection")
        print(f"{'='*60}\n")
        
        message_lower = request.message_text.lower()
        scam_keywords = ['urgent', 'verify', 'suspended', 'click here', 'prize', 'winner', 'bank account', 'password', 'otp', 'expire']
        risk_score = 0
        
        for keyword in scam_keywords:
            if keyword in message_lower:
                risk_score += 15
        
        risk_score = min(risk_score, 100)
        
        if risk_score >= 70:
            risk_level = "HIGH"
            explanation = "This message contains multiple red flags commonly found in scam messages. Do not click any links or share personal information."
        elif risk_score >= 40:
            risk_level = "MEDIUM"
            explanation = "This message shows some suspicious patterns. Verify the sender's identity before taking any action."
        else:
            risk_level = "LOW"
            explanation = "This message appears relatively safe, but always exercise caution with unsolicited messages."
    
    # Save to database
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO scam_checks (user_id, message_text, risk_score, risk_level, explanation)
            VALUES (?, ?, ?, ?, ?)
        """, (user['id'], request.message_text, risk_score, risk_level, explanation))
        conn.commit()
    
    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "explanation": explanation
    }

@app.get("/scam_history")
async def get_scam_history(token: str):
    """Get scam check history"""
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM scam_checks
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT 20
        """, (user['id'],))
        
        history = []
        for row in cursor.fetchall():
            history.append({
                "id": row[0],
                "message_text": row[2][:100] + "..." if len(row[2]) > 100 else row[2],
                "risk_score": row[3],
                "risk_level": row[4],
                "explanation": row[5],
                "timestamp": row[6]
            })
        
        return {"history": history}

@app.post("/redeem_coins")
async def redeem_coins(request: RedeemCoinsRequest, token: str):
    """Redeem coins for rewards"""
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if user['coin_balance'] < request.coins_required:
        raise HTTPException(status_code=400, detail="Insufficient coins")
    
    # Generate mock redemption code
    redemption_code = f"{request.brand.upper()}-{secrets.token_hex(4).upper()}"
    
    # Deduct coins and save redemption
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users SET coin_balance = coin_balance - ?
            WHERE id = ?
        """, (request.coins_required, user['id']))
        
        cursor.execute("""
            INSERT INTO coin_redemptions (user_id, brand, coins_spent, redemption_code)
            VALUES (?, ?, ?, ?)
        """, (user['id'], request.brand, request.coins_required, redemption_code))
        
        conn.commit()
    
    return {
        "message": "Coins redeemed successfully",
        "redemption_code": redemption_code,
        "brand": request.brand,
        "coins_spent": request.coins_required
    }

@app.get("/redemption_history")
async def get_redemption_history(token: str):
    """Get coin redemption history"""
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM coin_redemptions
            WHERE user_id = ?
            ORDER BY timestamp DESC
        """, (user['id'],))
        
        history = []
        for row in cursor.fetchall():
            history.append({
                "id": row[0],
                "brand": row[2],
                "coins_spent": row[3],
                "redemption_code": row[4],
                "timestamp": row[5]
            })
        
        return {"history": history}

@app.post("/upgrade_premium")
async def upgrade_premium(token: str):
    """Upgrade user to premium"""
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users SET is_premium = 1
            WHERE id = ?
        """, (user['id'],))
        conn.commit()
    
    return {"message": "Upgraded to premium successfully"}

@app.post("/ai_advisor")
async def ai_advisor(token: str):
    """Get AI investment advice (mock implementation)"""
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if user['is_premium'] != 1:
        raise HTTPException(status_code=403, detail="Premium feature only")
    
    # Mock AI advice based on user's spending
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE user_id = ?
            AND strftime('%Y-%m', timestamp) = strftime('%Y-%m', 'now')
        """, (user['id'],))
        current_spend = cursor.fetchone()[0]
    
    savings_potential = user['monthly_budget'] - current_spend
    
    advice = {
        "summary": "Based on your spending patterns, here are personalized recommendations:",
        "recommendations": [
            {
                "type": "SIP",
                "title": "Start a Systematic Investment Plan",
                "description": f"Consider investing ₹{int(savings_potential * 0.3)} monthly in diversified equity mutual funds for long-term wealth creation.",
                "risk": "Medium"
            },
            {
                "type": "Emergency Fund",
                "title": "Build Emergency Corpus",
                "description": f"Allocate ₹{int(savings_potential * 0.4)} to a liquid fund or high-interest savings account for emergencies.",
                "risk": "Low"
            },
            {
                "type": "ETF",
                "title": "Index Fund Investment",
                "description": f"Invest ₹{int(savings_potential * 0.3)} in low-cost index ETFs tracking Nifty 50 or Sensex for stable returns.",
                "risk": "Medium"
            }
        ],
        "disclaimer": "This is AI-generated advice for educational purposes. Consult a financial advisor before making investment decisions."
    }
    
    return advice

@app.get("/")
async def root():
    return {
        "app": "BudgetGuard API v2",
        "version": "2.0",
        "features": ["SQLite Database", "User Authentication", "Transaction Marking"],
        "endpoints": ["/register", "/login", "/logout", "/set_budget", "/add_transaction", "/mark_transaction", "/dashboard", "/simulate_payment"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
