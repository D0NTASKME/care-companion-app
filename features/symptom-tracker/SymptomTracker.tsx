import React, { useState } from 'react';
import { CameraIcon } from '../../constants';

// --- THE FIX: Define Production-Aware Base URL ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
// --- END OF FIX ---

// A reusable card component for consistent styling
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white shadow-lg rounded-xl p-6 ${className}`}>{children}</div>
);

// Updated interface to include an error state for better UX
interface AIResponse {
  severity: 'Mild' | 'Moderate' | 'Severe' | null;
  advice: string;
  isLoading: boolean;
  error: string; // Added to handle API errors gracefully
}

export const SymptomTracker: React.FC = () => {
  const [symptomDescription, setSymptomDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [aiResponse, setAiResponse] = useState<AIResponse>({
    severity: null,
    advice: '',
    isLoading: false,
    error: '',
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setPhoto(event.target.files[0]);
    }
  };

  // The core logic is now an async function to handle the API call
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Use the state to show a validation error in the UI instead of an alert
    if (!symptomDescription) {
      setAiResponse({ ...aiResponse, error: 'Please describe your symptom before analyzing.' });
      return;
    }
    
    // Reset state for a new request
    setAiResponse({ severity: null, advice: '', isLoading: true, error: '' });

    // FormData is required to send both text and a file in the same request
    const formData = new FormData();
    formData.append('description', symptomDescription);
    if (photo) {
      formData.append('photo', photo);
    }

    try {
      // --- THE FIX: Use the production-aware API URL ---
      const response = await fetch(`${API_BASE_URL}/api/symptom-analysis`, {
        method: 'POST',
        body: formData,
      });
      // --- END OF FIX ---

      if (!response.ok) {
        throw new Error(`Server responded with an error: ${response.statusText}`);
      }

      const data = await response.json();
      setAiResponse({
        severity: data.severity,
        advice: data.advice,
        isLoading: false,
        error: '',
      });

    } catch (err: any) {
      console.error("Error fetching symptom analysis:", err);
      setAiResponse({
        severity: null,
        advice: '',
        isLoading: false,
        error: "Failed to get analysis. Please ensure the backend server is running and try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Symptom Tracker</h2>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="symptom-description" className="block text-sm font-medium text-gray-700 mb-1">
              Describe your symptom
            </label>
            <textarea
              id="symptom-description"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
              placeholder="e.g., 'I have a red, itchy rash on my arm that started this morning.'"
              value={symptomDescription}
              onChange={(e) => setSymptomDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload a photo (optional)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                {photo ? (
                  <p className="text-xs text-green-600 font-semibold mt-2">{photo.name} selected</p>
                ) : (
                  <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                )}
              </div>
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={aiResponse.isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-mediumgray transition-colors"
            >
              {aiResponse.isLoading ? 'Analyzing...' : 'Analyze My Symptom'}
            </button>
          </div>
        </form>
      </Card>

      {/* Loading State */}
      {aiResponse.isLoading && (
        <Card className="text-center animate-pulse font-semibold text-gray-600">
          Communicating with AI assistant...
        </Card>
      )}

      {/* Error State */}
      {aiResponse.error && !aiResponse.isLoading && (
          <Card className="border-2 border-red-300 bg-red-50">
             <h3 className="text-lg font-bold text-red-800">Oops!</h3>
             <p className="text-red-700">{aiResponse.error}</p>
          </Card>
      )}

      {/* Success State */}
      {aiResponse.severity && !aiResponse.isLoading && (
        <Card className={
          aiResponse.severity === 'Severe' ? 'border-2 border-accent' :
          aiResponse.severity === 'Moderate' ? 'border-2 border-yellow-500' :
          'border-2 border-secondary'
        }>
          <h3 className="text-lg font-bold">AI Analysis Complete</h3>
          <p>
            <span className="font-semibold">Severity: </span>
            <span className={`font-bold ${
              aiResponse.severity === 'Severe' ? 'text-accent' :
              aiResponse.severity === 'Moderate' ? 'text-yellow-600' :
              'text-secondary'
            }`}>{aiResponse.severity}</span>
          </p>
          <p><span className="font-semibold">Recommended Action: </span>{aiResponse.advice}</p>
        </Card>
      )}
    </div>
  );
};