from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

# Correctly import all necessary modules
from . import crud, models, analyzer, database
from .state_manager import patient_state # The critical import

router = APIRouter()

# --- Helper function to get a database session ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Endpoint for manually entering clinical lab results ---
class ClinicalData(BaseModel):
    biomarker_level: float

@router.post("/clinical-data")
def update_clinical_data(data: ClinicalData):
    """Allows a user or clinician to manually enter new lab test results."""
    patient_state.update_clinical_biomarker(data.biomarker_level)
    print(f"Received new clinical biomarker level: {data.biomarker_level}")
    return {"status": "clinical data updated"}


# --- Journal endpoint that correctly updates patient state ---
@router.post("/journal", response_model=models.JournalEntryResponse)
def create_new_journal_entry(entry: models.JournalEntryCreate, db: Session = Depends(get_db)):
    # 1. Analyze the journal entry to get the sentiment score
    analysis_result = analyzer.analyze_journal_entry(entry.content)
    
    # 2. Update the central patient state with the new score
    if analysis_result and analysis_result.get("sentiment_score") is not None:
        patient_state.update_from_journal(analysis_result["sentiment_score"])

    # 3. Save the full result to the database
    db_entry = crud.create_journal_entry(db=db, entry=entry, analysis_result=analysis_result)
    
    return db_entry


# --- THIS IS THE FINAL, UPGRADED SYMPTOM TRACKER ENDPOINT ---
@router.post("/symptom-analysis", response_model=models.SymptomAnalysisResponse)
async def analyze_symptom(description: str = Form(...), photo: Optional[UploadFile] = File(None), db: Session = Depends(get_db)):
    """
    Orchestrates the entire symptom tracking process:
    1. Gets an AI analysis of the symptom.
    2. Saves the new symptom to the database history.
    3. Fetches the full recent history.
    4. Triggers a recalculation of the patient's overall symptom score.
    """
    # In a real app, you would handle the file upload properly. For now, we'll just
    # get the filename as a placeholder for the database.
    photo_path_placeholder = photo.filename if photo else None
    image_bytes = await photo.read() if photo else None
    
    # 1. Get the AI analysis (severity and advice)
    result = analyzer.analyze_symptom_with_image(text_description=description, image_bytes=image_bytes)
    
    if result and result.get("severity"):
        # 2. Save the new symptom report to our history database
        crud.create_symptom_report(db=db, description=description, result=result, photo_path=photo_path_placeholder)
        
        # 3. Fetch all symptoms from the last 7 days
        recent_symptoms = crud.get_recent_symptoms(db=db, days=7)
        
        # 4. Trigger the state manager to recalculate the score based on this full history
        patient_state.recalculate_symptom_score(recent_symptoms)
        
    return models.SymptomAnalysisResponse(**result)


# --- This endpoint for fetching all entries remains the same ---
@router.get("/journal", response_model=List[models.JournalEntryResponse])
def read_all_journal_entries(db: Session = Depends(get_db)):
    return crud.get_all_journal_entries(db=db)