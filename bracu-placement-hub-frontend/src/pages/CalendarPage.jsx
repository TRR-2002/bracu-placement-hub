import React, { useState } from 'react';
import { useContext } from 'react';
import Navbar from '../components/Navbar';
import CalendarView from '../components/CalendarView';
import DeadlineCountdown from '../components/DeadlineCountdown';
import InterviewSchedule from '../components/InterviewSchedule';
import { AuthContext } from '../context/AuthContext';

const CalendarPage = () => {
  const { token, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please login to view your calendar</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📅 My Calendar</h1>
          <p className="text-gray-600">Track your applications, deadlines, and interviews</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {[
              { id: 'overview', label: '📅 Calendar', icon: '📅' },
              { id: 'deadlines', label: '⏰ Deadlines', icon: '⏰' },
              { id: 'interviews', label: '🎥 Interviews', icon: '🎥' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-4 font-semibold border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <CalendarView token={token} />
          </div>
        )}

        {activeTab === 'deadlines' && (
          <div className="space-y-8">
            <DeadlineCountdown token={token} />
          </div>
        )}

        {activeTab === 'interviews' && (
          <div className="space-y-8">
            <InterviewSchedule token={token} />
          </div>
        )}
      </div>

      {/* Footer with info */}
      <div className="bg-blue-50 border-t border-blue-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold text-gray-800 mb-2">📱 Synced Calendar</h3>
              <p className="text-gray-600 text-sm">
                Your events are synced to your Google Calendar automatically
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2">🔔 Get Notified</h3>
              <p className="text-gray-600 text-sm">
                Receive notifications for upcoming deadlines and interviews
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2">✅ Stay Organized</h3>
              <p className="text-gray-600 text-sm">
                Never miss an important deadline or interview again
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default CalendarPage;
