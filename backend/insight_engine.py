def calculate_progress_score(state: dict) -> dict:
    """
    Calculates a "Treatment Progress Score" (from 0 to 100) by analyzing a 
    holistic set of patient data. This score serves as a proxy for remission
    likelihood and overall well-being.
    """
    
    # --- Step 1: Normalize Each Metric to a 0-100 Scale ---
    # We convert each raw data point into a standardized score where 100 is always "best".
    
    # Metric A: Heart Rate Variability (HRV). Higher is better.
    # We'll consider a healthy, recovering HRV to be around 50ms.
    hrv_score = min(100, (state.get('hrv', 40) / 50.0) * 100)
    
    # Metric B: Journal Sentiment. Closer to -1.0 is better (more positive).
    # We map the AI's sentiment score from [-1.0, 1.0] to our [0, 100] scale.
    # sentiment = -1.0 -> score = 100. sentiment = 1.0 -> score = 0.
    sentiment_score = (1 - state.get('sentiment', 0.0)) * 50
    
    # Metric C: Symptom Severity. Lower is better.
    # The score ranges from 0-10, so we invert it. 0 symptoms = 100 score.
    symptom_score = 100 - (state.get('symptoms', 0.0) * 10)
    
    # Metric D: Clinical Biomarker (e.g., CEA level). Lower is better.
    # We assume a healthy target is < 2.5. This metric is given the highest weight.
    # Using a safe division to avoid zero-division errors.
    clinical_biomarker = state.get('clinical_biomarker', 10.0)
    if clinical_biomarker > 0:
        biomarker_score = min(100, (2.5 / clinical_biomarker) * 100)
    else:
        biomarker_score = 100

    # --- Step 2: Define Weights for Each Health Pillar ---
    # This reflects the clinical importance of each data point.
    weights = {
        "hrv": 0.20,           # 20% contribution from physiological stress
        "sentiment": 0.15,     # 15% contribution from emotional state
        "symptoms": 0.25,      # 25% contribution from reported physical symptoms
        "clinical": 0.40       # 40% contribution from hard clinical data
    }
    
    # --- Step 3: Calculate the Final Weighted "Treatment Progress Score" ---
    final_score = (
        hrv_score * weights["hrv"] +
        sentiment_score * weights["sentiment"] +
        symptom_score * weights["symptoms"] +
        biomarker_score * weights["clinical"]
    )
    # Ensure the final score is always between 0 and 100.
    final_score = max(0, min(100, final_score))
    
    # --- Step 4: Generate a Plain-English Insight Based on the Score ---
    insight = ""
    if final_score > 85:
        insight = "Showing excellent signs of positive progress. All metrics are trending strongly in the right direction."
    elif final_score > 65:
        insight = "Steady positive progress. Your physiological and emotional well-being are well-aligned with recovery."
    elif final_score > 40:
        insight = "Maintaining a stable condition. Focus on consistency in self-care and symptom management."
    else:
        insight = "Multiple metrics indicate a high level of body and mind stress. This is a key time to focus on rest and consult your care team."
        
    return {"progress_score": final_score, "insight": insight}