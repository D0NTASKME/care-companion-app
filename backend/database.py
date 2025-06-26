from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import datetime

# --- No changes to this section ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./care_companion.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- The existing JournalEntry table (no changes here) ---
class JournalEntry(Base):
    __tablename__ = "journal_entries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, default=1)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    content = Column(Text, nullable=False)
    ai_analysis = Column(Text, nullable=True)
    ai_encouragement = Column(Text, nullable=True)
    sentiment_score = Column(Float, nullable=True)

# --- NEW: A table to store a history of all reported symptoms ---
class SymptomReport(Base):
    __tablename__ = "symptom_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, default=1)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    description = Column(Text, nullable=False)
    
    # We will store the AI-determined severity for historical analysis
    severity = Column(String, nullable=False) 
    
    # We won't store the photo itself, but a path to where it's saved on the server
    photo_path = Column(String, nullable=True)

# This function now creates BOTH tables if they don't exist
def create_db_and_tables():
    Base.metadata.create_all(bind=engine)