from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from dotenv import load_dotenv
import os
from pydantic import BaseModel

load_dotenv()

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SessionData(BaseModel):
    username: str
    caught_butterflies: int

def get_db_connection():
    return psycopg2.connect(
        user=os.getenv("user"),
        password=os.getenv("password"),
        host=os.getenv("host"),
        port=os.getenv("port"),
        dbname=os.getenv("dbname")
    )

@app.get("/")
async def get_players():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT username, caught_butterflies FROM sessions ORDER BY caught_butterflies DESC LIMIT 10")
        players = cur.fetchall()
        return {"data": [{"username": row[0], "caught_butterflies": row[1]} for row in players]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()

@app.post("/save-session")
async def save_session(session_data: SessionData):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get next ID
        cur.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM sessions;")
        next_id = cur.fetchone()[0]
        
        # Insert new session
        cur.execute("""
            INSERT INTO sessions (id, username, caught_butterflies, session_dt)
            VALUES (%s, %s, %s, NOW())
        """, (next_id, session_data.username, session_data.caught_butterflies))
        
        conn.commit()
        return {"message": "Session saved successfully", "id": next_id}
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()