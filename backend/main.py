from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from dotenv import load_dotenv
import os
from pydantic import BaseModel
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

# CORS configuration (keeping your existing variable names)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Keeping your existing wildcard
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
            user=os.getenv("user"),  # Keeping your existing variable name
            password=os.getenv("password"),
            host=os.getenv("host"),
            port=os.getenv("port"),
            dbname=os.getenv("dbname"),
            sslmode="require" if os.getenv("RAILWAY_ENVIRONMENT") == "production" else None
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
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
        logger.error(f"Error fetching players: {str(e)}")
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
        
        # Add debug logging
        logger.info(f"Attempting to save session: {session_data}")
        
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
        
        # Get updated leaderboard
        cur.execute("""
            SELECT username, caught_butterflies 
            FROM sessions 
            ORDER BY caught_butterflies DESC 
            LIMIT 10
        """)
        leaderboard = cur.fetchall()
        
        conn.commit()
        
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
        logger.error(f"Error saving session: {str(e)}")
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
    try:
        conn = get_db_connection()
        conn.close()
        return {"status": "healthy", "timestamp": datetime.now()}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "error": str(e)
            }
        )
        
# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        print("Client disconnected")