import psycopg2
import sys
import urllib.parse

# Try exact password and url-encoded password
passwords = [
    "Rtl170119*ting",
    urllib.parse.quote_plus("Rtl170119*ting")
]

print("Testing Supabase connection...")

for pwd in passwords:
    try:
        print(f"\nTrying password format: {pwd}")
        conn = psycopg2.connect(
            host="aws-1-ap-northeast-2.pooler.supabase.com",
            port="5432",
            user="postgres.ufnttcuyhajolwvqjslp",
            password=pwd,
            dbname="postgres",
            connect_timeout=5
        )
        print("✅ SUCCESS! Connected to database.")
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"❌ FAILED: {e}")

# Try transaction mode port 6543
for pwd in passwords:
    try:
        print(f"\nTrying port 6543 with password format: {pwd}")
        conn = psycopg2.connect(
            host="aws-1-ap-northeast-2.pooler.supabase.com",
            port="6543",
            user="postgres.ufnttcuyhajolwvqjslp",
            password=pwd,
            dbname="postgres",
            connect_timeout=5
        )
        print("✅ SUCCESS! Connected to database on port 6543.")
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"❌ FAILED: {e}")

