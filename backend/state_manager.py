from typing import List
import datetime
# We need to import the database model to use it as a type hint,
# which helps with code completion and error checking.
from .database import SymptomReport

class PatientState:
    """Manages a holistic view of the patient's real-time health data."""
    def __init__(self):
        # Wearable Data
        self.hrv = 40.0  # Default Heart Rate Variability
        
        # Journal Data
        self.avg_sentiment = 0.0 # A moving average of recent journal sentiment
        
        # Symptom Data - This is now calculated dynamically from history
        self.symptom_severity_score = 0.0 
        
        # Clinical Data (Manually entered by user/clinician)
        self.clinical_biomarker = 10.0 # e.g., CEA level. Lower is better.
        
        print("PatientState manager initialized for predictive analysis.")

    def update_from_mobile_app(self, data: dict):
        """Receives real data packet from the conceptual companion app."""
        self.hrv = data.get('hrv', self.hrv)
        print(f"State updated from mobile app: HRV={self.hrv}")

    def update_from_journal(self, new_score: float):
        """Updates the average sentiment from a new journal entry."""
        if new_score is None: return
        # A moving average of the last 5 sentiment scores for stability
        self.avg_sentiment = ((self.avg_sentiment * 4) + new_score) / 5
        print(f"Sentiment updated from journal. New average: {self.avg_sentiment:.2f}")

    def update_clinical_biomarker(self, level: float):
        """Updates the clinical biomarker level from manual entry."""
        self.clinical_biomarker = level
        print(f"Clinical biomarker updated. New level: {self.clinical_biomarker:.2f}")

    # --- THIS IS THE NEW, INTELLIGENT FUNCTION ---
    def recalculate_symptom_score(self, recent_symptoms: List[SymptomReport]):
        """
        Calculates a weighted severity score based on a list of recent symptoms.
        More recent and more severe symptoms have a higher impact on the score.
        """
        print("--- DEBUG: Recalculating symptom score based on history ---")
        new_score = 0.0
        
        # Define the weight for each severity level
        severity_weights = {"Mild": 1.0, "Moderate": 2.5, "Severe": 5.0}
        
        for symptom in recent_symptoms:
            # Calculate how many days old the symptom report is
            days_old = (datetime.datetime.utcnow() - symptom.timestamp).total_seconds() / 86400
            
            # Apply a decay factor: a symptom from today has full weight (1.0),
            # one from 7 days ago has very little weight (0.0).
            decay = max(0, (7.0 - days_old) / 7.0) # Linear decay over 7 days
            
            # Get the base severity weight from our dictionary
            base_weight = severity_weights.get(symptom.severity, 0.0)
            
            # The final score for this symptom is its severity weighted by how recent it is.
            new_score += base_weight * decay
            print(f"DEBUG: Symptom '{symptom.severity}' ({days_old:.1f} days old) added {base_weight * decay:.2f} to score.")

        # We cap the score at 10 to keep it normalized for the insight engine.
        self.symptom_severity_score = min(10.0, new_score)
        print(f"--- DEBUG: New calculated symptom score: {self.symptom_severity_score:.2f} ---")


    def get_current_state(self) -> dict:
        """
        Gets the latest state. We no longer need to decay the symptom score here
        as it's now dynamically calculated based on a full history.
        """
        return {
            "hrv": self.hrv,
            "sentiment": self.avg_sentiment,
            "symptoms": self.symptom_severity_score,
            "clinical_biomarker": self.clinical_biomarker
        }

# Create a single global instance to be shared across the application
patient_state = PatientState()