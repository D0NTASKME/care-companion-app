# app/models.py
from pydantic import BaseModel, Field
from typing import Optional, Literal
import datetime

# --- Existing Journal Models ---
class JournalEntryBase(BaseModel):
    content: str
# ... (rest of journal models are unchanged)
class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntryResponse(JournalEntryBase):
    id: int
    user_id: int
    timestamp: datetime.datetime
    ai_analysis: Optional[str] = None
    ai_encouragement: Optional[str] = None

    class Config:
        orm_mode = True

# --- NEW - Symptom Analysis Models ---
class SymptomAnalysisResponse(BaseModel):
    severity: Literal['Mild', 'Moderate', 'Severe']
    advice: str