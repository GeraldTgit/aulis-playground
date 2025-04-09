from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from dotenv import load_dotenv
import os
from pydantic import BaseModel
from datetime import datetime

load_dotenv()

app = FastAPI()

# Enhanced CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SessionData(BaseModel):
    username: str
    caught_butterflies: int

def get_db_connection():
    try:
        conn = psycopg2.connect(
            user=os.getenv("PGUSER"),
            password=os.getenv("PGPASSWORD"),
            host=os.getenv("PGHOST"),
            port=os.getenv("PGPORT"),
            dbname=os.getenv("PGDATABASE"),
            sslmode="require" if os.getenv("RAILWAY_ENVIRONMENT") == "production" else None
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {str(e)}")
        raise HTTPException(status_code=500, detail="Database connection failed")

@app.get("/")
async def get_players():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT username, caught_butterflies 
            FROM sessions 
            ORDER BY caught_butterflies DESC 
            LIMIT 10
        """)
        players = cur.fetchall()
        return {
            "status": "success",
            "data": [
                {
                    "username": row[0], 
                    "caught_butterflies": row[1]
                } for row in players
            ]
        }
    except Exception as e:
        print(f"Error fetching players: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={
                "status": "error",
                "message": "Failed to fetch leaderboard"
            }
        )
    finally:
        if conn:
            conn.close()

@app.post("/save-session")
async def save_session(session_data: SessionData):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Insert new session with RETURNING clause
        cur.execute("""
            INSERT INTO sessions (username, caught_butterflies, session_dt)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (
            session_data.username, 
            session_data.caught_butterflies,
            datetime.now()
        ))
        
        new_id = cur.fetchone()[0]
        conn.commit()
        
        # Get updated leaderboard
        cur.execute("""
            SELECT username, caught_butterflies 
            FROM sessions 
            ORDER BY caught_butterflies DESC 
            LIMIT 10
        """)
        leaderboard = cur.fetchall()
        
        return {
            "status": "success",
            "message": "Session saved successfully",
            "id": new_id,
            "leaderboard": [
                {
                    "username": row[0], 
                    "caught_butterflies": row[1]
                } for row in leaderboard
            ]
        }
    except Exception as e:
        print(f"Error saving session: {str(e)}")
        if conn:
            conn.rollback()
        raise HTTPException(
            status_code=500, 
            detail={
                "status": "error",
                "message": "Failed to save session"
            }
        )
    finally:
        if conn:
            conn.close()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}