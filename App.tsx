import React from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { SmartMonitoringDashboard } from './features/smart-monitoring/SmartMonitoringDashboard';
import { SymptomTracker } from './features/symptom-tracker/SymptomTracker';
import { ReflectionJournal } from './features/journal/ReflectionJournal';
import { HumanConnection } from './features/connection/HumanConnection';
import { APP_TITLE, ChartIcon, SymptomIcon, JournalIcon, MessageIcon } from './constants';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      end // Ensures exact match for parent routes like "/" or "/dashboard"
      className={({ isActive }) =>
        `flex flex-col items-center justify-center px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        ${isActive ? 'bg-primary text-white scale-105 shadow-lg' : 'text-darkgray hover:bg-primary/10 hover:text-primary'}`
      }
      aria-current={({isActive}) => isActive ? "page" : undefined}
    >
      <span className="w-5 h-5 sm:w-6 sm:h-6 mb-1">{icon}</span>
      {label}
    </NavLink>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-100 to-sky-100">
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-primary">{APP_TITLE}</h1>
            {/* Future placeholder for user profile/settings icon */}
          </div>
        </header>

        <main className="flex-grow container mx-auto px-4 py-6" id="main-content">
          <Routes>
            <Route path="/" element={<SmartMonitoringDashboard />} />
            <Route path="/dashboard" element={<SmartMonitoringDashboard />} />
            <Route path="/symptoms" element={<SymptomTracker />} />
            <Route path="/journal" element={<ReflectionJournal />} />
            <Route path="/connect" element={<HumanConnection />} />
            <Route path="*" element={<SmartMonitoringDashboard />} /> {/* Fallback to dashboard */}
          </Routes>
        </main>

        <nav className="bg-white shadow-t-md sticky bottom-0 z-50 border-t border-gray-200" aria-label="Main navigation">
          <div className="container mx-auto px-1 sm:px-2 py-2 grid grid-cols-4 gap-1">
            <NavItem to="/dashboard" icon={<ChartIcon />} label="Monitor" />
            <NavItem to="/symptoms" icon={<SymptomIcon />} label="Symptoms" />
            <NavItem to="/journal" icon={<JournalIcon />} label="Journal" />
            <NavItem to="/connect" icon={<MessageIcon />} label="Connect" />
          </div>
        </nav>
      </div>
    </HashRouter>
  );
};

export default App;
