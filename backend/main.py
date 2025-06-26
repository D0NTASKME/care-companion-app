import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import all our custom backend modules
from .database import create_db_and_tables
from .api import router as api_router
from .ws_manager import manager
from .state_manager import patient_state
from .insight_engine import calculate_progress_score # <-- The new "brain"

# This line creates the database and tables if they don't exist
create_db_and_tables()

# This is the Pydantic model for the data packet we expect from our
# conceptual companion mobile app (which uses Health Connect / HealthKit).
class HealthConnectData(BaseModel):
    hrv: int
    # You could add more real data points here in the future
    # heart_rate: int
    # sleep_hours: float

# This is the main background task that runs the insight engine
async def data_processing_loop():
    """
    The main engine loop. It periodically gets the current holistic patient state,
    calculates the "Treatment Progress Score", and broadcasts the full
    analysis to the web dashboard.
    """
    while True:
        # 1. Get the latest state from our central manager
        current_state = patient_state.get_current_state()
        
        # 2. Feed the state into our insight engine to get the analysis
        analysis = calculate_progress_score(current_state)
        
        # 3. Prepare the rich data packet to send to the frontend dashboard
        data_packet = {
            "progress_score": analysis["progress_score"],
            "insight": analysis["insight"],
            # Also pass the raw data points for display on the dashboard
            "hrv": current_state["hrv"],
            "avg_sentiment": current_state["sentiment"],
            "symptom_score": current_state["symptoms"],
            "clinical_biomarker": current_state["clinical_biomarker"]
        }
        
        # 4. Broadcast the new data packet to all connected dashboard clients
        await manager.broadcast(data_packet)
        
        # 5. Wait for 2 seconds before the next cycle
        await asyncio.sleep(2)


# --- FastAPI App Setup ---
app = FastAPI(title="CareCompanion API", version="2.0-beta")

# Add CORS middleware to allow the frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Start the data processing engine in the background when the server starts
    asyncio.create_task(data_processing_loop())

# --- API Endpoints ---

# This is the new, primary endpoint for receiving real data from the mobile app
@app.post("/api/health-connect-data")
def update_health_data(data: HealthConnectData):
    """
    This endpoint receives real data from the patient's companion mobile app.
    It's the bridge between the wearable's data and our system.
    """
    patient_state.update_from_mobile_app(data.model_dump())
    return {"status": "data received and state updated"}

# Include all the other routes from api.py (for journal, symptoms, clinical data)
app.include_router(api_router, prefix="/api")

# This is the WebSocket that our web dashboard connects to
@app.websocket("/api/ws/health-data")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)