// src/features/journal/ReflectionJournal.tsx
import React, { useState, useEffect } from 'react';

// This is the data structure from OUR backend, which includes more than just feedback
interface JournalEntry {
  id: number;
  content: string;
  timestamp: string;
  ai_encouragement: string;
}

// The URL for OUR backend endpoint that saves and retrieves entries
const API_URL = 'http://localhost:8000/api/journal';

export const ReflectionJournal: React.FC = () => {
  // We add state to hold the list of all past entries
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Start true to show loading message
  const [isSaving, setIsSaving] = useState(false); // A separate state for the save button
  const [error, setError] = useState('');

  // This hook fetches all past journal entries when the page first loads
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch past entries. Is the backend running?');
        const data = await response.json();
        setEntries(data); // Our backend already sends them sorted
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEntries();
  }, []); // The empty array [] means this runs only once when the component mounts

  // This function handles submitting a new entry to the backend
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent the form from reloading the page
    if (!newEntry.trim()) return;

    setIsSaving(true);
    setError('');
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newEntry }),
      });
      if (!response.ok) throw new Error('Failed to save your entry.');
      const savedEntry = await response.json();
      
      // Add the new entry to the top of the list in our UI
      setEntries([savedEntry, ...entries]);
      setNewEntry(''); // Clear the input box for the next entry
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // The JSX is almost identical, but now it loops over past entries
  return (
    <div className="space-y-8">
      {/* --- Main Journal Input Card --- */}
      <div className="p-6 bg-white shadow-lg rounded-xl">
        <h2 className="text-2xl font-semibold text-primary mb-4">Mental Health & Reflection Journal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="journal-entry" className="block text-sm font-medium text-darkgray">Your private thoughts:</label>
            <textarea
              id="journal-entry"
              rows={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 focus:ring-2 focus:ring-primary"
              placeholder="Write freely here..."
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isSaving || !newEntry.trim()}
              className="w-full flex justify-center py-2 px-4 border rounded-md text-white bg-secondary hover:bg-secondary/90 disabled:bg-gray-400"
            >
              {isSaving ? 'Saving...' : 'Save My Thoughts'}
            </button>
          </div>
          {error && <div className="mt-4 p-3 bg-red-100 text-accent rounded-md"><p>{error}</p></div>}
        </form>
      </div>

      {/* --- Past Entries Section --- */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-700">Past Entries</h3>
        {isLoading ? (
          <p className="text-center text-gray-500 py-4">Loading entries...</p>
        ) : entries.length > 0 ? (
          entries.map(entry => (
            <div key={entry.id} className="bg-white p-4 shadow-md rounded-lg">
              <p className="text-xs text-gray-500 mb-2">
                {new Date(entry.timestamp).toLocaleString()}
              </p>
              <p className="text-gray-800 whitespace-pre-wrap">{entry.content}</p>
              {entry.ai_encouragement && (
                <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                  <p className="text-sm font-semibold text-secondary">{entry.ai_encouragement}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">No entries yet.</p>
            <p className="text-sm text-gray-400">Your first one will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};