import os
import json
import google.generativeai as genai
from typing import Optional
from dotenv import load_dotenv

# --- Setup and Initialization (No Changes Here) ---
load_dotenv()
CERT_PATH = os.getenv("SSL_CERT_FILE")
if CERT_PATH and os.path.exists(CERT_PATH):
    os.environ['SSL_CERT_FILE'] = CERT_PATH
    print("Manually set SSL_CERT_FILE environment variable for this process.")

try:
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    journal_model = genai.GenerativeModel('gemini-1.5-flash')
    symptom_model = genai.GenerativeModel('gemini-1.5-flash')
    print("Gemini AI clients initialized successfully.")
except Exception as e:
    print(f"An error occurred during Gemini initialization: {e}")
    journal_model = None
    symptom_model = None


# --- Journal Analysis Function (Already Robust, No Changes) ---
def analyze_journal_entry(text: str) -> dict:
    if not journal_model:
        return {"analysis": "AI model not initialized.", "sentiment_score": 0.0, "encouragement": "Could not connect."}
    
    # This prompt asks for a numerical score, making the AI a quantitative tool.
    SYSTEM_PROMPT = """
    You are an expert sentiment analysis AI with a focus on empathy. Analyze the user's journal entry.
    You MUST respond ONLY with a JSON object with three keys:
    1. "analysis": A concise, one-sentence summary of the main emotion.
    2. "sentiment_score": A numerical score from -1.0 (very positive/calm/hopeful) to 1.0 (very negative/distressed/anxious). A neutral entry should be 0.0.
    3. "encouragement": A short, gentle, and uplifting message (1-2 sentences) appropriate to the sentiment.
    """
    
    safe_fallback_response = {
        "analysis": "Entry saved.",
        "sentiment_score": 0.1,
        "encouragement": "Thank you for sharing. Remember that every step, no matter how small, is part of your journey."
    }
    
    try:
        full_prompt = f"{SYSTEM_PROMPT}\n\nUser Journal Entry:\n---\n{text}"
        safety_settings = [{"category": c, "threshold": "BLOCK_NONE"} for c in ["HARM_CATEGORY_HARASSMENT", "HARM_CATEGORY_HATE_SPEECH", "HARM_CATEGORY_SEXUALLY_EXPLICIT", "HARM_CATEGORY_DANGEROUS_CONTENT"]]
        response = journal_model.generate_content(full_prompt, safety_settings=safety_settings)

        if not response.parts:
            print("WARNING: Journal analysis response was blocked, likely due to safety filters.")
            return safe_fallback_response

        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(cleaned_response)
    except Exception as e:
        print(f"Error during Gemini journal analysis: {e}")
        return safe_fallback_response


# --- THIS IS THE UPGRADED SYMPTOM ANALYSIS FUNCTION ---
def analyze_symptom_with_image(text_description: str, image_bytes: Optional[bytes] = None) -> dict:
    if not symptom_model:
         return {"severity": "Moderate", "advice": "Could not connect to the AI service."}
    
    # Define a safe fallback response for when the AI fails or is blocked
    safe_fallback = {"severity": "Moderate", "advice": "Unable to analyze symptom at this time. As a precaution, please consult your care team."}

    SYMPTOM_PROMPT = """
    You are a clinical analysis AI assistant for the CareCompanion app. 
    Your role is to assess a patient's description of a symptom (and an optional photo) and provide a severity level and clear, safe advice.
    Analyze the user's input and determine:
    1.  **Severity**: Classify as "Mild", "Moderate", or "Severe".
    2.  **Advice**: Provide a concise, actionable recommendation.
    GUIDELINES:
    - ALWAYS prioritize patient safety.
    - If the symptom sounds serious (e.g., severe pain, difficulty breathing, chest pain, uncontrolled bleeding, signs of infection like pus or red streaks), or if the image is alarming, ALWAYS classify it as "Severe" and advise immediate medical attention.
    - NEVER diagnose a specific condition.
    - Respond ONLY with a JSON object with two keys: "severity" and "advice".
    """
    
    prompt_parts = [SYMPTOM_PROMPT, "\n\n--- USER'S REPORT ---\n", text_description]
    if image_bytes:
        image_part = {"mime_type": "image/jpeg", "data": image_bytes}
        prompt_parts.insert(1, image_part)
        
    try:
        # We now apply the same safety settings as the journal to prevent blocking
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
        
        response = symptom_model.generate_content(prompt_parts, safety_settings=safety_settings)
        
        # --- THE FIX ---
        # We now check for a blocked response before trying to parse the text
        if not response.parts:
            print("WARNING: Symptom analysis response was blocked by safety filters.")
            return safe_fallback

        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(cleaned_response)
        
    except Exception as e:
        print(f"Error in Gemini symptom analysis: {e}")
        return safe_fallback