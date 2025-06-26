import React, { useState, useEffect, useRef } from 'react';

// --- THE FIX: Define Production-Aware Base URLs ---
// For standard HTTP requests (fetch)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
// For WebSocket connections
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';
// --- END OF FIX ---

// This is the new, rich data packet from our "Real Data" backend
interface ProgressData {
  progress_score: number;
  insight: string;
  hrv: number;
  avg_sentiment: number;
  symptom_score: number;
  clinical_biomarker: number;
}

// A reusable card component for consistent styling
const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`bg-white shadow-lg rounded-xl p-6 ${className}`}>{children}</div>
);

// --- NEW: A "Progress Gauge" component to be the centerpiece of our dashboard ---
const ProgressGauge: React.FC<{ score: number }> = ({ score }) => {
  // Ensure score is between 0 and 100 for visual calculations
  const clampedScore = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 52; // 2 * pi * radius of the circle
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;
  
  // Dynamically change color based on the score
  const getColor = () => {
    if (clampedScore > 80) return 'text-secondary'; // Green
    if (clampedScore > 50) return 'text-primary';   // Blue
    if (clampedScore > 30) return 'text-yellow-500';// Yellow
    return 'text-accent'; // Red
  };

  return (
    <div className="relative flex items-center justify-center h-48 w-48 mx-auto">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        {/* Background track */}
        <circle className="text-gray-200" strokeWidth="12" stroke="currentColor" fill="transparent" r="52" cx="60" cy="60" />
        {/* Progress arc */}
        <circle
          className={`transition-all duration-1000 ease-out ${getColor()}`}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="52"
          cx="60"
          cy="60"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className={`absolute flex flex-col items-center justify-center ${getColor()}`}>
        <span className="text-5xl font-bold">{Math.round(clampedScore)}</span>
        <span className="text-sm font-medium">/ 100</span>
      </div>
    </div>
  );
};

export const SmartMonitoringDashboard: React.FC = () => {
  const [liveData, setLiveData] = useState<Partial<ProgressData>>({});
  const webSocket = useRef<WebSocket | null>(null);

  // This effect manages the WebSocket connection to receive live data from the backend
  useEffect(() => {
    // --- THE FIX: Use the production-aware WebSocket URL ---
    const socketUrl = `${WS_BASE_URL}/api/ws/health-data`;
    console.log("Connecting WebSocket to:", socketUrl); // Helpful for debugging
    webSocket.current = new WebSocket(socketUrl);
    // --- END OF FIX ---
    webSocket.current.onmessage = (event) => {
      try {
        const data: ProgressData = JSON.parse(event.data);
        setLiveData(data);
      } catch (error) { console.error("Failed to parse WebSocket message:", error); }
    };
    return () => { webSocket.current?.close(); };
  }, []);

  // --- NEW: Functions to simulate data coming from external sources for the demo ---
  const simulateMobileAppData = async () => {
    // This simulates a stressful event detected by the wearable (e.g., poor sleep -> low HRV)
    const data = { hrv: 25 }; 
    alert("Simulating stressful wearable data (low HRV). The Progress Score will decrease.");
    // --- THE FIX: Use the production-aware API URL ---
    await fetch(`${API_BASE_URL}/api/health-connect-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(err => alert(`Failed to send data: ${err}`));
    // --- END OF FIX ---
  };
  
  const simulateClinicalData = async () => {
    const level = parseFloat(prompt("Enter new Clinical Biomarker level (e.g., 8.5 is high, 2.0 is good):", "8.5") || "8.5");
    if (isNaN(level)) return;
    alert(`Sending new lab result. A higher biomarker level will decrease the Progress Score.`);
    // --- THE FIX: Use the production-aware API URL ---
    await fetch(`${API_BASE_URL}/api/clinical-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biomarker_level: level }),
    }).catch(err => alert(`Failed to send data: ${err}`));
  // --- END OF FIX ---
    };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Treatment Progress Dashboard</h2>
        <div className="flex space-x-2">
           <button onClick={simulateMobileAppData} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 shadow" title="Simulate receiving real, stressful data from the patient's companion mobile app.">Simulate Wearable</button>
           <button onClick={simulateClinicalData} className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs hover:bg-purple-600 shadow" title="Simulate a user or clinician entering new lab results.">Enter Lab Results</button>
        </div>
      </div>
      
      {/* --- Main Progress Score & Insight Card --- */}
      <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-1">
                <h3 className="text-lg font-medium text-darkgray text-center mb-2">Progress Score</h3>
                <ProgressGauge score={liveData.progress_score || 0} />
            </div>
            <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-darkgray mb-2">Insight Engine Analysis</h3>
                <div className="p-4 bg-slate-100 rounded-lg min-h-[100px] flex items-center">
                    <p className="font-semibold text-primary">{liveData.insight || "Awaiting sufficient data for analysis..."}</p>
                </div>
            </div>
          </div>
      </Card>
      
      {/* --- Contributing Factors Display --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
            <h4 className="text-sm font-medium text-gray-500">Wearable HRV</h4>
            <p className="text-3xl font-bold text-secondary mt-1">{liveData.hrv?.toFixed(0) || 'N/A'}<span className="text-sm ml-1">ms</span></p>
        </Card>
        <Card className="text-center">
            <h4 className="text-sm font-medium text-gray-500">Journal Sentiment</h4>
            <p className="text-3xl font-bold text-secondary mt-1">{liveData.avg_sentiment?.toFixed(2) || '0.00'}</p>
        </Card>
         <Card className="text-center">
            <h4 className="text-sm font-medium text-gray-500">Symptom Severity</h4>
            <p className="text-3xl font-bold text-accent mt-1">{liveData.symptom_score?.toFixed(1) || '0.0'}</p>
        </Card>
         <Card className="text-center">
            <h4 className="text-sm font-medium text-gray-500">Lab Biomarker</h4>
            <p className="text-3xl font-bold text-accent mt-1">{liveData.clinical_biomarker?.toFixed(1) || 'N/A'}</p>
        </Card>
      </div>
    </div>
  );
};