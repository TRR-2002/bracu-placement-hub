import React, { useState, useEffect } from 'react';
import { Video, MapPin, Clock, User, Briefcase, Mail } from 'lucide-react';

const InterviewSchedule = ({ token }) => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // upcoming, past, all

  useEffect(() => {
    fetchInterviews();
    const interval = setInterval(fetchInterviews, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [token]);

  const fetchInterviews = async () => {
    console.log('🔄 Refreshing interviews...');
    try {
      const response = await fetch('http://localhost:1350/api/calendar/deadlines', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Interviews data received:', data);
        if (data.success) {
          // Filter for interview events
          const allEvents = [...(data.upcoming || []), ...(data.passed || [])];
          const interviewEvents = allEvents.filter(
            event => event.eventType === 'interview'
          );
          console.log('📅 Interview events found:', interviewEvents.length);
          setInterviews(interviewEvents);
        }
      } else {
        console.error('❌ Failed to fetch interviews, status:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInterviewStatus = (deadline) => {
    const now = new Date();
    const interviewDate = new Date(deadline);
    const diff = interviewDate - now;

    if (diff < 0) return 'completed';
    if (diff < 24 * 60 * 60 * 1000) return 'today';
    if (diff < 7 * 24 * 60 * 60 * 1000) return 'this-week';
    return 'upcoming';
  };

  const formatInterviewTime = (deadline) => {
    const date = new Date(deadline);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilInterview = (deadline) => {
    const now = new Date();
    const interviewDate = new Date(deadline);
    const diff = interviewDate - now;

    if (diff < 0) return 'Completed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h`;
    return 'Today';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-gray-100 border-gray-300';
      case 'today':
        return 'bg-red-50 border-red-300';
      case 'this-week':
        return 'bg-orange-50 border-orange-300';
      default:
        return 'bg-green-50 border-green-300';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-gray-200 text-gray-800';
      case 'today':
        return 'bg-red-200 text-red-800';
      case 'this-week':
        return 'bg-orange-200 text-orange-800';
      default:
        return 'bg-green-200 text-green-800';
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    const status = getInterviewStatus(interview.deadline);
    if (filter === 'upcoming') return status !== 'completed';
    if (filter === 'past') return status === 'completed';
    return true;
  });

  const sortedInterviews = [...filteredInterviews].sort(
    (a, b) => new Date(a.deadline) - new Date(b.deadline)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-gray-500">Loading interviews...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Video className="w-6 h-6 mr-2 text-purple-500" />
          Interview Schedule
        </h2>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {['upcoming', 'past', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-semibold capitalize transition border-b-2 ${
                filter === f
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {f}
              {f === 'upcoming' && ` (${interviews.filter(i => getInterviewStatus(i.deadline) !== 'completed').length})`}
              {f === 'past' && ` (${interviews.filter(i => getInterviewStatus(i.deadline) === 'completed').length})`}
              {f === 'all' && ` (${interviews.length})`}
            </button>
          ))}
        </div>

        {/* Interviews list */}
        {sortedInterviews.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No interviews scheduled</p>
            <p className="text-gray-500 text-sm mt-2">
              {filter === 'past' && 'Great job completing all your interviews!'}
              {filter === 'upcoming' && 'Check back soon for interview invitations.'}
              {filter === 'all' && 'No interview history yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedInterviews.map((interview, idx) => {
              const status = getInterviewStatus(interview.deadline);
              const timeUntil = getTimeUntilInterview(interview.deadline);

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-lg border-2 transition hover:shadow-md ${getStatusColor(status)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {interview.jobTitle || 'Interview'}
                        </h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${getStatusBadgeColor(status)}`}>
                          {status === 'today' ? 'Today' :
                           status === 'this-week' ? 'This Week' :
                           status === 'completed' ? 'Completed' :
                           'Upcoming'}
                        </span>
                      </div>
                      <p className="text-gray-600 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {interview.company}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">
                        {timeUntil}
                      </div>
                    </div>
                  </div>

                  {/* Interview details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{formatInterviewTime(interview.deadline)}</span>
                    </div>

                    {/* Map ping or video call icon */}
                    <div className="flex items-center gap-2 text-gray-700">
                      <Video className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Video Interview</span>
                    </div>
                  </div>

                  {/* Meeting link if available */}
                  {interview.meetLink && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Video className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold">Meeting Link:</span>
                      </div>
                      <a
                        href={interview.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-sm text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {interview.meetLink}
                      </a>
                    </div>
                  )}


                </div>
              );
            })}
          </div>
        )}

        {/* Refresh button */}
        <button
          onClick={() => {
            setLoading(true);
            fetchInterviews();
          }}
          disabled={loading}
          className={`mt-6 w-full font-semibold py-2 px-4 rounded-lg transition ${
            loading
              ? 'bg-purple-300 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`}
        >
          {loading ? 'Refreshing...' : 'Refresh Interviews'}
        </button>
      </div>
    </div>
  );
};

export default InterviewSchedule;
