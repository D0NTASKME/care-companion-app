
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Mock process.env.API_KEY for development if not set by the environment
// The API key is hardcoded here as per the user's request.
// In a real deployment, API_KEY must be set securely in the environment.
const USER_PROVIDED_API_KEY = "AIzaSyAhmDJ5xJ4oveN5VncASmNhH9OhxLXTqc8";

if (typeof process === 'undefined') {
  // @ts-ignore
  window.process = { env: { API_KEY: USER_PROVIDED_API_KEY } };
} else {
  process.env.API_KEY = USER_PROVIDED_API_KEY;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);