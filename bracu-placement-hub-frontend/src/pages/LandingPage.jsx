import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase, Users, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header/Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              BRACU Placement Hub
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-200 transition transform hover:-translate-y-0.5"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Your Career Journey Starts Here</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight">
              Connect with
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"> Top Employers</span>
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed">
              BRACU Placement Hub bridges the gap between talented students and leading companies. 
              Discover opportunities, showcase your skills, and launch your dream career.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/register')}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-blue-300 transition transform hover:-translate-y-1 flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </button>
              <button
                onClick={() => {
                  document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition"
              >
                Learn More
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
              <div>
                <div className="text-3xl font-black text-blue-600">500+</div>
                <div className="text-sm text-gray-600 font-semibold">Students</div>
              </div>
              <div>
                <div className="text-3xl font-black text-blue-600">100+</div>
                <div className="text-sm text-gray-600 font-semibold">Companies</div>
              </div>
              <div>
                <div className="text-3xl font-black text-blue-600">1000+</div>
                <div className="text-sm text-gray-600 font-semibold">Placements</div>
              </div>
            </div>
          </div>

          {/* Right Decorative Elements */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Job Opportunities</div>
                  <div className="text-sm text-gray-600">Find your perfect role</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Network Building</div>
                  <div className="text-sm text-gray-600">Connect with recruiters</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Career Growth</div>
                  <div className="text-sm text-gray-600">Track your progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">About BRACU Placement Hub</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Empowering BRAC University students to achieve their career aspirations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">For Students</h3>
              <p className="text-blue-100 leading-relaxed">
                Build your professional profile, discover job opportunities, and connect with top recruiters. 
                Get personalized job recommendations powered by AI.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">For Recruiters</h3>
              <p className="text-blue-100 leading-relaxed">
                Access a pool of talented BRACU students, post job openings, and find the perfect candidates 
                using our AI-powered talent search.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-blue-100 leading-relaxed">
                To create a seamless bridge between BRAC University students and the professional world, 
                fostering career growth and industry connections.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <button
              onClick={() => navigate('/register')}
              className="px-10 py-4 bg-white text-blue-600 font-bold rounded-xl hover:shadow-2xl transition transform hover:-translate-y-1"
            >
              Join Our Community Today
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">BRACU Placement Hub</span>
          </div>
          <p className="text-sm">
            © 2026 BRAC University Placement Hub. All rights reserved.
          </p>
          <p className="text-sm mt-2">
            Empowering students, connecting futures.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
