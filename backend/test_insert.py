import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

conn = psycopg2.connect(
    user=os.getenv("user"),
    password=os.getenv("password"),
    host=os.getenv("host"),
    port=os.getenv("port"),
    dbname=os.getenv("dbname")
)

cur = conn.cursor()

cur.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM sessions;")
next_id = cur.fetchone()[0]
print("Next ID:", next_id)

cur.execute("""
    INSERT INTO sessions (id, username, caught_butterflies, session_dt)
    VALUES (%s, %s, %s, NOW())
""", (next_id, 'Raven', 2))

conn.commit()
print("Inserted.")

cur.execute("SELECT * FROM sessions WHERE id = %s;", (next_id,))
print("Inserted row:", cur.fetchone())

cur.close()
conn.close()
