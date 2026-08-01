import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import shutil

load_dotenv()

# We will use sqlite for local testing if POSTGRES_URL is not set
DATABASE_URL = os.getenv("POSTGRES_URL")

if not DATABASE_URL:
    src_db = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lazarus.db")
    tmp_db = "/tmp/lazarus.db"
    
    # On Vercel, the filesystem is read-only except for /tmp.
    # SQLite needs write access to the directory to create lock files even for reads.
    if os.path.exists(src_db):
        try:
            if not os.path.exists(tmp_db):
                shutil.copy2(src_db, tmp_db)
            DATABASE_URL = f"sqlite:///{tmp_db}"
        except Exception:
            DATABASE_URL = f"sqlite:///{src_db}"
    else:
        DATABASE_URL = "sqlite:///./lazarus.db"

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# For sqlite we need connect_args={"check_same_thread": False}, but for postgres we don't
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
