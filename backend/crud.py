from sqlalchemy.orm import Session
from . import models, database
import datetime # <-- Import the datetime library for date calculations

# This import is not strictly needed anymore but is harmless
import json 

# ===================================================================
# --- Journal-Related Functions (No Changes Here) ---
# ===================================================================

def create_journal_entry(db: Session, entry: models.JournalEntryCreate, analysis_result: dict):
    """
    Creates a new journal entry and saves all parts of the AI analysis 
    (summary, score, and encouragement) to the database.
    """
    db_entry = database.JournalEntry(
        content=entry.content,
        ai_analysis=analysis_result.get("analysis"),
        ai_encouragement=analysis_result.get("encouragement"),
        sentiment_score=analysis_result.get("sentiment_score")
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def get_all_journal_entries(db: Session):
    """
    Retrieves all journal entries from the database, ordering them so the newest
    entries appear first.
    """
    return db.query(database.JournalEntry).order_by(database.JournalEntry.timestamp.desc()).all()

def get_journal_entry(db: Session, entry_id: int):
    """Retrieves a single journal entry by its unique ID."""
    return db.query(database.JournalEntry).filter(database.JournalEntry.id == entry_id).first()


# ===================================================================
# --- NEW: Symptom History Functions ---
# ===================================================================

def create_symptom_report(db: Session, description: str, result: dict, photo_path: str = None):
    """
    Saves a new symptom report to the database's history table.
    
    Args:
        db (Session): The active database session.
        description (str): The user's text description of the symptom.
        result (dict): The dictionary from the AI containing the 'severity'.
        photo_path (str, optional): A placeholder for the path to a saved image.
    """
    db_symptom = database.SymptomReport(
        description=description,
        severity=result.get("severity"),
        photo_path=photo_path
    )
    db.add(db_symptom)
    db.commit()
    db.refresh(db_symptom)
    return db_symptom

def get_recent_symptoms(db: Session, days: int = 7):
    """
    Fetches all symptom reports from the last N days. This history is used
    to calculate the dynamic symptom severity score.
    
    Args:
        db (Session): The active database session.
        days (int): The number of days into the past to look for symptoms.
    """
    # Calculate the cutoff date (e.g., 7 days ago from now)
    cutoff_date = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    
    # Query the SymptomReport table for all entries more recent than the cutoff date
    return db.query(database.SymptomReport).filter(database.SymptomReport.timestamp >= cutoff_date).all()