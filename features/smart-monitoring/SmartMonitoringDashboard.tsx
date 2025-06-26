import React, { useState, useEffect, useRef } from 'react';

// --- No changes to the Base URLs ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

// --- No changes to the data structure or components ---
interface ProgressData {
  progress_score: number;
  insight: string;
  hrv: number;
  avg_sentiment: number;
  symptom_score: number;
  clinical_biomarker: number;
}

const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`bg-white shadow-lg rounded-xl p-6 ${className}`}>{children}</div>
);

const ProgressGauge: React.FC<{ score: number }> = ({ score }) => {
  const clampedScore = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;
  
  const getColor = () => {
    if (clampedScore > 80) return 'text-secondary';
    if (clampedScore > 50) return 'text-primary';
    if (clampedScore > 30) return 'text-yellow-500';
    return 'text-accent';
  };

  return (
    <div className="relative flex items-center justify-center h-48 w-48 mx-auto">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle className="text-gray-200" strokeWidth="12" stroke="currentColor" fill="transparent" r="52" cx="60" cy="60" />
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
  // NEW: Add a state to visually track the connection status
  const [connectionStatus, setConnectionStatus] = useState<'Connecting' | 'Connected' | 'Disconnected'>('Connecting');
  const webSocket = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socketUrl = `${WS_BASE_URL}/api/ws/health-data`;
    console.log("Attempting to connect WebSocket to:", socketUrl);
    
    webSocket.current = new WebSocket(socketUrl);

    // ==========================================================
    // --- THIS IS THE CRITICAL FIX ---
    // We are adding all the event listeners to see the full lifecycle.
    // ==========================================================
    
    // 1. What happens when the connection is successfully established.
    webSocket.current.onopen = () => {
      console.log("%cSUCCESS: WebSocket connection established.", "color: green; font-weight: bold;");
      setConnectionStatus('Connected');
    };

    // 2. What happens when a message is received from the server.
    webSocket.current.onmessage = (event) => {
      // Log the raw data to see it arrive
      console.log("RECEIVED:", event.data); 
      try {
        const data: ProgressData = JSON.parse(event.data);
        setLiveData(data);
      } catch (error) { 
        console.error("Failed to parse WebSocket message:", error); 
      }
    };

    // 3. What happens if there is a connection error.
    webSocket.current.onerror = (error) => {
      console.error("%cERROR: WebSocket error observed:", "color: red; font-weight: bold;", error);
    };

    // 4. What happens when the connection is closed.
    webSocket.current.onclose = (event) => {
      console.log("INFO: WebSocket connection closed.", event);
      setConnectionStatus('Disconnected');
    };

    // The cleanup function remains the same.
    return () => {
      webSocket.current?.close();
    };
  }, []); // The empty array ensures this runs only once.

  // --- No changes to the simulation functions ---
  const simulateMobileAppData = async () => {
    const data = { hrv: 25 }; 
    alert("Simulating stressful wearable data (low HRV). The Progress Score will decrease.");
    await fetch(`${API_BASE_URL}/api/health-connect-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(err => alert(`Failed to send data: ${err}`));
  };
  
  const simulateClinicalData = async () => {
    const level = parseFloat(prompt("Enter new Clinical Biomarker level (e.g., 8.5 is high, 2.0 is good):", "8.5") || "8.5");
    if (isNaN(level)) return;
    alert(`Sending new lab result. A higher biomarker level will decrease the Progress Score.`);
    await fetch(`${API_BASE_URL}/api/clinical-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biomarker_level: level }),
    }).catch(err => alert(`Failed to send data: ${err}`));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Treatment Progress Dashboard</h2>
        {/* We add a helpful status indicator */}
        <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500 font-semibold">{connectionStatus}</span>
        </div>
      </div>
      
      <div className="flex justify-center space-x-4 mb-6">
           <button onClick={simulateMobileAppData} className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Simulate Wearable</button>
           <button onClick={simulateClinicalData} className="px-4 py-2 bg-purple-500 text-white rounded-lg shadow hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">Enter Lab Results</button>
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
                <div className="p-4 bg-slate-100 rounded-lg min-h-[100px] flex items-center justify-center">
                    <p className="font-semibold text-primary text-center">{liveData.insight || "Awaiting live data from server..."}</p>
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
            <p className="text-3xl font-bold text-secondary mt-1">{liveData.avg_sentiment?.toFixed(2) || 'N/A'}</p>
        </Card>
         <Card className="text-center">
            <h4 className="text-sm font-medium text-gray-500">Symptom Severity</h4>
            <p className="text-3xl font-bold text-accent mt-1">{liveData.symptom_score?.toFixed(1) || 'N/A'}</p>
        </Card>
         <Card className="text-center">
            <h4 className="text-sm font-medium text-gray-500">Lab Biomarker</h4>
            <p className="text-3xl font-bold text-accent mt-1">{liveData.clinical_biomarker?.toFixed(1) || 'N/A'}</p>
        </Card>
      </div>
    </div>
  );
};