from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from dotenv import load_dotenv
import os

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware to allow frontend access from different origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow only the React frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Load environment variables
load_dotenv()

# Fetch variables
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

def connect_to_database():
    try:
        # Connect to the database
        connection = psycopg2.connect(
            user=USER,
            password=PASSWORD,
            host=HOST,
            port=PORT,
            dbname=DBNAME
        )
        print("✅ Connected!")

        # Create cursor
        cursor = connection.cursor()
        
        # Read SQL query from file
        with open("top_players.sql", "r") as file:
            query = file.read()
        
        cursor.execute(query)
        connection.commit()

        rows = cursor.fetchall()

        # Format the result to return only the username and caught_butterflies columns
        result = [{"username": row[0], "caught_butterflies": row[1]} for row in rows]

        print(result)

        cursor.close()
        connection.close()
        print("🔌 Connection closed.")
        return result

    except Exception as e:
        print(f"❌ Error: {e}")
        return str(e)

@app.get("/")
async def read_root():
    # Call the function to connect to the database and execute the query
    result = connect_to_database()
    return {"message": "Welcome to Auli's Playmates!", "data": result}
