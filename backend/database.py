# backend/app/database.py

import os # <-- Must be imported
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import datetime

# ==============================================================================
# --- PRODUCTION-READY DATABASE CONFIGURATION ---
# ==============================================================================

# This line will now read the DATABASE_URL environment variable you will set on Render.
# For local testing, it will fall back to using your SQLite file if DATABASE_URL isn't found.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./care_companion.db")

# A common issue: Hosting services (Neon, Heroku) provide "postgres://",
# but the newest versions of SQLAlchemy prefer "postgresql://".
# This code automatically fixes the URL if it's a Postgres one, making it robust.
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# The `connect_args` are only for SQLite. We remove them for production.
# The engine will be created based on the URL provided.
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

# --- The rest of the file is unchanged, as it's already perfect ---

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, default=1)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    content = Column(Text, nullable=False)
    ai_analysis = Column(Text, nullable=True)
    ai_encouragement = Column(Text, nullable=True)
    sentiment_score = Column(Float, nullable=True)

class SymptomReport(Base):
    __tablename__ = "symptom_reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, default=1)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    description = Column(Text, nullable=False)
    severity = Column(String, nullable=False) 
    photo_path = Column(String, nullable=True)

def create_db_and_tables():
    # This single command works for both SQLite and PostgreSQL.
    # It will create the tables in whichever database the `engine` is connected to.
    Base.metadata.create_all(bind=engine)