from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import sqlite3
import hashlib
import secrets
from contextlib import contextmanager

app = FastAPI(title="BudgetGuard API v2")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DB_PATH = "budgetguard.db"

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
                password_hash TEXT NOT NULL,
                monthly_budget REAL DEFAULT 0,
                emergency_fund REAL DEFAULT 0,
                emergency_pin TEXT,
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
        
        conn.commit()

# Initialize database on startup
init_db()

# Pydantic models
class RegisterRequest(BaseModel):
    username: str
    password: str

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

class MarkTransactionRequest(BaseModel):
    transaction_id: int
    is_useful: bool

class SimulatePaymentRequest(BaseModel):
    amount: float
    description: str
    use_emergency: bool = False
    emergency_pin: Optional[str] = None

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
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (request.username, password_hash)
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
            INSERT INTO transactions (user_id, amount, description, category)
            VALUES (?, ?, ?, ?)
        """, (user['id'], request.amount, request.description, request.category))
        conn.commit()
        txn_id = cursor.lastrowid
    
    return {
        "message": "Transaction added",
        "transaction_id": txn_id
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
        
        for row in cursor.fetchall():
            txn = dict(row)
            cumulative_spend += txn['amount']
            
            transactions.append({
                "id": txn['id'],
                "amount": txn['amount'],
                "description": txn['description'],
                "category": txn['category'],
                "is_useful": txn['is_useful'],
                "timestamp": txn['timestamp']
            })
            
            # Add to chart data (cumulative)
            chart_data.append({
                "timestamp": txn['timestamp'],
                "amount": cumulative_spend,
                "transaction_id": txn['id']
            })
        
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
            "chart_data": chart_data
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
