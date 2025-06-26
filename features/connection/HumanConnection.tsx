import React from 'react';
import { UserCircleIcon } from '../../constants'; // Assuming UserCircleIcon is in constants

export const HumanConnection: React.FC = () => {
  return (
    <div className="p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-primary mb-6">Human Connection</h2>
      
      <div className="space-y-8">
        {/* Messaging Support */}
        <div className="p-6 bg-lightgray rounded-md shadow">
          <h3 className="text-xl font-medium text-darkgray mb-3">Messaging Support</h3>
          <p className="text-sm text-gray-600 mb-4">
            Reach out to your assigned nurse or therapist for non-urgent advice, reassurance, or check-ins.
          </p>
          <button
            type="button"
            className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
          >
            Message Your Support Team
          </button>
        </div>

        {/* Peer Support Community */}
        <div className="p-6 bg-lightgray rounded-md shadow">
          <h3 className="text-xl font-medium text-darkgray mb-3">Peer Support Community</h3>
          <p className="text-sm text-gray-600 mb-4">
            Connect with others on similar journeys. Share tips, encouragement, or just talk in our moderated forum.
          </p>
          <div className="space-y-3">
            <div className="flex items-start p-3 bg-white rounded shadow-sm">
              <UserCircleIcon className="h-8 w-8 text-mediumgray mr-3 flex-shrink-0"/>
              <div>
                <p className="text-sm font-semibold text-darkgray">Upcoming Chat: "Coping with Treatment Side Effects"</p>
                <p className="text-xs text-gray-500">Tomorrow at 3:00 PM</p>
              </div>
            </div>
             <div className="flex items-start p-3 bg-white rounded shadow-sm">
              <UserCircleIcon className="h-8 w-8 text-mediumgray mr-3 flex-shrink-0"/>
              <div>
                <p className="text-sm font-semibold text-darkgray">Forum Thread: "Tips for Managing Nausea"</p>
                <p className="text-xs text-gray-500">3 new replies</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="mt-4 w-full sm:w-auto px-4 py-2 border border-secondary text-secondary rounded-md shadow-sm text-sm font-medium hover:bg-secondary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
          >
            Visit Community Forum
          </button>
        </div>

        {/* Emotion Check-In Reminders */}
        <div className="p-6 bg-lightgray rounded-md shadow">
          <h3 className="text-xl font-medium text-darkgray mb-3">Emotion Check-In</h3>
          <p className="text-sm text-gray-600 mb-4">
            Weekly prompts encourage you to reflect and connect. Remember, you're not alone.
          </p>
          <div className="p-3 bg-primary/10 border border-primary/30 text-primary rounded-md">
            <p className="font-medium">This week's prompt:</p>
            <p className="text-sm"><em>"How are you truly feeling today? Consider sharing with a peer or your journal."</em></p>
          </div>
        </div>
      </div>
    </div>
  );
};
