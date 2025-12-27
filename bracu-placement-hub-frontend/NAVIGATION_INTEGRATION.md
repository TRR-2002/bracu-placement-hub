// Example: How to Add Calendar Link to Your Navigation

// ========== Example 1: Add to Navbar.jsx ==========

// In your Navbar.jsx component, add this link:

<nav className="navbar">
  {/* Other nav items */}
  
  {/* For Students: Add this */}
  {user?.role === 'student' && (
    <Link 
      to="/calendar" 
      className="nav-link flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 transition"
    >
      <span>📅</span>
      <span>My Calendar</span>
    </Link>
  )}
  
  {/* For All Users: Or add this */}
  <Link 
    to="/calendar" 
    className="nav-link flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 transition"
  >
    📅 Calendar
  </Link>
  
  {/* Other nav items */}
</nav>


// ========== Example 2: In Dashboard ==========

// Add calendar card to your dashboard:

export const DashboardOverview = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Existing cards */}
      
      {/* New Calendar Card */}
      <Link 
        to="/calendar"
        className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg hover:shadow-xl transition transform hover:scale-105"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">My Calendar</h3>
            <p className="text-blue-100">View deadlines & interviews</p>
          </div>
          <div className="text-4xl">📅</div>
        </div>
      </Link>
    </div>
  );
};


// ========== Example 3: Quick Access Button ==========

// Add floating action button:

export const CalendarFAB = () => {
  return (
    <Link
      to="/calendar"
      className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition transform hover:scale-110"
      title="Open Calendar"
    >
      <span className="text-2xl">📅</span>
    </Link>
  );
};


// ========== Example 4: Navbar with Calendar Badge ==========

// Show upcoming deadlines count in nav:

import { useState, useEffect } from 'react';

export const NavbarWithCalendarBadge = ({ token }) => {
  const [deadlineCount, setDeadlineCount] = useState(0);

  useEffect(() => {
    const fetchDeadlineCount = async () => {
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
            setDeadlineCount(data.totalUpcoming || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching deadlines:', error);
      }
    };

    fetchDeadlineCount();
  }, [token]);

  return (
    <Link 
      to="/calendar"
      className="relative flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 transition"
    >
      <span>📅</span>
      <span>Calendar</span>
      {deadlineCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {deadlineCount}
        </span>
      )}
    </Link>
  );
};


// ========== Example 5: Mobile Menu Addition ==========

// Add to mobile navigation menu:

<MobileMenu>
  {/* Existing items */}
  
  <div className="border-t border-gray-200 pt-4">
    <h3 className="px-4 py-2 text-sm font-semibold text-gray-600">ORGANIZATION</h3>
    
    <Link
      to="/calendar"
      className="px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition"
    >
      <span className="text-xl">📅</span>
      <span className="font-medium">My Calendar</span>
    </Link>
    
    <Link
      to="/notifications"
      className="px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition"
    >
      <span className="text-xl">🔔</span>
      <span className="font-medium">Notifications</span>
    </Link>
  </div>
</MobileMenu>


// ========== Example 6: Sidebar Menu ==========

// Add to sidebar navigation:

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-white shadow-lg">
      <nav className="mt-6">
        <SidebarSection title="MANAGE">
          <SidebarLink icon="📋" label="My Applications" href="/applications" />
          <SidebarLink icon="👤" label="My Profile" href="/profile" />
        </SidebarSection>

        <SidebarSection title="ORGANIZE">
          <SidebarLink icon="📅" label="Calendar" href="/calendar" />
          <SidebarLink icon="❤️" label="Saved Jobs" href="/saved-jobs" />
          <SidebarLink icon="📨" label="Messages" href="/messages" />
          <SidebarLink icon="🔔" label="Notifications" href="/notifications" />
        </SidebarSection>

        <SidebarSection title="COMMUNITY">
          <SidebarLink icon="💬" label="Forum" href="/forum" />
          <SidebarLink icon="⭐" label="Reviews" href="/reviews" />
        </SidebarSection>
      </nav>
    </aside>
  );
};


// ========== Example 7: Breadcrumb Navigation ==========

// Show calendar in breadcrumbs:

<Breadcrumb>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/calendar">Calendar</BreadcrumbItem>
  <BreadcrumbItem active>My Deadlines</BreadcrumbItem>
</Breadcrumb>


// ========== Example 8: Feature Highlight Card ==========

// Show in onboarding or homepage:

<FeatureCard
  icon="📅"
  title="Smart Calendar"
  description="View all your application deadlines and interviews in one place"
  action={{
    label: "Open Calendar",
    href: "/calendar"
  }}
  badge="NEW"
/>


// ========== Complete Navigation Component Example ==========

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const Navbar = () => {
  const { user } = useContext(AuthContext);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-blue-600">
          BRACU Placements
        </Link>

        {/* Main Navigation */}
        <div className="flex items-center gap-6">
          <Link to="/jobs" className="text-gray-600 hover:text-blue-600">
            Jobs
          </Link>
          
          {/* NEW: Calendar Link */}
          <Link 
            to="/calendar" 
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            <span>📅</span>
            <span>Calendar</span>
          </Link>
          
          <Link to="/messages" className="text-gray-600 hover:text-blue-600">
            Messages
          </Link>
          
          <Link to="/forum" className="text-gray-600 hover:text-blue-600">
            Forum
          </Link>
          
          {user?.role === 'recruiter' && (
            <Link to="/recruiter/dashboard" className="text-gray-600 hover:text-blue-600">
              Dashboard
            </Link>
          )}

          <Link 
            to={`/profile/view/${user?.userId}`} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Profile
          </Link>
        </div>
      </div>
    </nav>
  );
};


// ========== Tailwind Classes Reference ==========
/*
Common tailwind classes for calendar link styling:

Hover Effects:
- hover:bg-blue-100
- hover:text-blue-600
- hover:shadow-lg
- hover:scale-110 (for FAB)

Colors:
- bg-blue-500 / bg-blue-600
- text-white
- text-gray-600

Positioning:
- flex items-center gap-2
- px-4 py-2
- rounded-lg

Responsive:
- md:hidden (hide on mobile)
- sm:inline-block (show on small)

Badges:
- absolute top-0 right-0
- bg-red-500
- rounded-full
- h-5 w-5
- flex items-center justify-center
*/


// ========== Notification Badge Version ==========

export const CalendarWithBadge = ({ upcomingCount }) => {
  return (
    <Link to="/calendar" className="relative group">
      <span className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition">
        📅 Calendar
      </span>
      
      {upcomingCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
          {upcomingCount}
        </span>
      )}
      
      {/* Hover tooltip */}
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
        {upcomingCount} upcoming deadlines
      </span>
    </Link>
  );
};
