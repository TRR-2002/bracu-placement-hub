import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

const DeadlineCountdown = ({ token }) => {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeadlines();
    const interval = setInterval(fetchDeadlines, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [token]);

  const fetchDeadlines = async () => {
    try {
      const response = await fetch('http://localhost:1350/api/calendar/deadlines', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDeadlines(data.upcoming || []);
        }
      }
    } catch (error) {
      console.error('Error fetching deadlines:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;

    if (diff < 0) return { text: 'Expired', isExpired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let text = '';
    if (days > 0) text = `${days}d ${hours}h`;
    else if (hours > 0) text = `${hours}h ${minutes}m`;
    else text = `${minutes}m`;

    const isUrgent = days < 3;

    return { text, isUrgent, isExpired: false, days, hours };
  };

  const getUrgencyColor = (deadline) => {
    const { isUrgent, isExpired } = getTimeRemaining(deadline);
    if (isExpired) return 'bg-gray-100';
    if (isUrgent) return 'bg-red-50 border-red-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getUrgencyIcon = (deadline) => {
    const { isUrgent, isExpired } = getTimeRemaining(deadline);
    if (isExpired) return <CheckCircle className="w-5 h-5 text-gray-500" />;
    if (isUrgent) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-blue-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-gray-500">Loading deadlines...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-blue-500" />
          Application Deadlines
        </h2>

        {deadlines.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
            <p className="text-gray-600 text-lg">No upcoming deadlines!</p>
            <p className="text-gray-500 text-sm mt-2">You're all caught up.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deadlines
              .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
              .map((deadline, idx) => {
                const timeData = getTimeRemaining(deadline.deadline);
                const deadlineDate = new Date(deadline.deadline);

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 transition hover:shadow-md ${getUrgencyColor(deadline.deadline)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getUrgencyIcon(deadline.deadline)}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800">
                            {deadline.jobTitle || 'Job Application'}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {deadline.company}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Deadline: {deadlineDate.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-xl font-bold ${
                          timeData.isExpired ? 'text-gray-500' :
                          timeData.isUrgent ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {timeData.text}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {timeData.isExpired ? 'Expired' : 'Remaining'}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {!timeData.isExpired && (
                      <div className="mt-3 bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            timeData.isUrgent ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${Math.max(0, Math.min(100, (timeData.days / 30) * 100))}%`
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-3">Status Legend</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">More than 3 days remaining</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-gray-600">Less than 3 days (Urgent)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Expired or completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeadlineCountdown;
