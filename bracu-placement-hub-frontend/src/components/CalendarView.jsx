import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';

const CalendarView = ({ token }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch deadlines on mount
  useEffect(() => {
    fetchDeadlines();
  }, [token]);

  const fetchDeadlines = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:1350/api/calendar/deadlines', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch deadlines');
      
      const data = await response.json();
      if (data.success) {
        const allEvents = [...(data.upcoming || []), ...(data.passed || [])];
        setEvents(allEvents);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching deadlines:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get first day of month
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get events for a specific date
  const getEventsForDate = (day) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    return events.filter(event => {
      const eventDate = new Date(event.deadline);
      
      // Compare using local date components (not UTC)
      const sameYear = eventDate.getFullYear() === targetDate.getFullYear();
      const sameMonth = eventDate.getMonth() === targetDate.getMonth();
      const sameDay = eventDate.getDate() === targetDate.getDate();
      
      return sameYear && sameMonth && sameDay;
    });
  };

  // Determine event color based on type
  const getEventColor = (event) => {
    if (event.eventType === 'interview') return 'bg-red-100 border-red-300 text-red-800';
    if (event.eventType === 'recruitment') return 'bg-blue-100 border-blue-300 text-blue-800';
    return 'bg-cyan-100 border-cyan-300 text-cyan-800';
  };

  // Days of week
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate days array for calendar
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const daysArray = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    daysArray.push(null);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{monthYear}</h2>
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {daysArray.map((day, idx) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              const isToday = day && 
                new Date().toDateString() === 
                new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

              return (
                <div
                  key={idx}
                  onClick={() => day && setSelectedDate(day)}
                  className={`min-h-20 p-2 rounded-lg border-2 cursor-pointer transition ${
                    day
                      ? isToday
                        ? 'bg-blue-50 border-blue-500'
                        : selectedDate === day
                        ? 'bg-gray-100 border-gray-400'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  {day && (
                    <>
                      <div className="font-semibold text-gray-800">{day}</div>
                      {dayEvents.length > 0 && (
                        <div className="mt-1">
                          {dayEvents.slice(0, 2).map((event, i) => (
                            <div
                              key={i}
                              className="text-xs bg-blue-200 text-blue-800 px-1 py-0.5 rounded mt-1 truncate"
                            >
                              {event.jobTitle || 'Event'}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-600 mt-1">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Upcoming Deadlines
          </h3>

          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No events scheduled</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events
                .filter(event => new Date(event.deadline) >= new Date())
                .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                .slice(0, 10)
                .map((event, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border-l-4 ${getEventColor(event)}`}>
                    <div className="font-semibold text-sm">{event.jobTitle || event.company}</div>
                    <div className="flex items-center text-xs mt-1 gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(event.deadline).toLocaleDateString()}
                    </div>
                    {event.company && (
                      <div className="flex items-center text-xs mt-1 gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.company}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Sync button */}
          <button
            onClick={fetchDeadlines}
            className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Refresh Calendar
          </button>
        </div>
      </div>

      {/* Selected date details */}
      {selectedDate && (
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Events on {formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate))}
          </h3>

          {getEventsForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500">No events on this date</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getEventsForDate(selectedDate).map((event, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <h4 className="font-bold text-lg text-gray-800">{event.jobTitle}</h4>
                  <p className="text-gray-600 text-sm mt-1">{event.company}</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span>{new Date(event.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="inline-block mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        event.eventType === 'interview' ? 'bg-red-200 text-red-800' :
                        event.eventType === 'recruitment' ? 'bg-blue-200 text-blue-800' :
                        'bg-cyan-200 text-cyan-800'
                      }`}>
                        {event.eventType === 'interview' ? 'Interview' :
                         event.eventType === 'recruitment' ? 'Recruitment Drive' :
                         'Application Deadline'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
