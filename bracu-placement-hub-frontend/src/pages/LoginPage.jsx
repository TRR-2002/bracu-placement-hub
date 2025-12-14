import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";

function LoginPage() {
  const navigate = useNavigate();
  const { loginAction } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate inputs
    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:1350/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Decode token to get user info
      const decodedUser = jwtDecode(data.token);

      // Store in context and localStorage
      loginAction(data);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.userId);

      // Role-based routing
      if (data.user.role === "student") {
        // Check if student has completed profile
        const profileResponse = await fetch(
          "http://localhost:1350/api/profile/status",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.token}`,
            },
          }
        );

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();

          if (profileData.hasProfile) {
            navigate(`/profile/view/${data.user.userId}`);
          } else {
            navigate("/create-profile");
          }
        } else {
          navigate("/create-profile");
        }
      } else if (data.user.role === "recruiter") {
        // Route recruiter to job management dashboard
        navigate("/recruiter/dashboard");
      } else if (data.user.role === "admin") {
        // Route admin to admin dashboard
        navigate("/admin/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in to BRACU Placement Hub</p>
        </div>

        {/* Login Form */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
                autoComplete="current-password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-bold py-3 rounded-md transition ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed text-gray-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Register here
              </button>
            </p>
          </div>
        </div>

        {/* Developer Login Link (Optional - for testing) */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/dev-login")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Developer Token Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
