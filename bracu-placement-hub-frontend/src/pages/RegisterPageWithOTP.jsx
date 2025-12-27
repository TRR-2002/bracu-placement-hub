import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function RegisterPageWithOTP() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [otp, setOtp] = useState("");
  const [sentOTP, setSentOTP] = useState(""); // For testing
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (formData.role === "student") {
      if (!formData.email.endsWith("@g.bracu.ac.bd")) {
        setError("Students must use a @g.bracu.ac.bd email address");
        return false;
      }
    } else {
      if (formData.email.endsWith("@g.bracu.ac.bd")) {
        setError("Recruiters and admins must use a non-university email address");
        return false;
      }
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:1350/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setSentOTP(data.otp); // For testing - REMOVE IN PRODUCTION
      setSuccess("OTP sent to your email! Valid for 10 minutes.");
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:1350/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to verify OTP. Please try again.");
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
            {step === 1 ? "Create Account" : "Verify OTP"}
          </h1>
          <p className="text-gray-600">
            {step === 1 ? "Join BRACU Placement Hub" : "Enter the OTP sent to your email"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              1
            </div>
            <div className={`w-20 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              2
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span className="w-20 text-center">Details</span>
            <span className="w-20 text-center">Verify</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
              {success}
            </div>
          )}

          {/* TESTING ONLY - Show OTP */}
          {sentOTP && step === 2 && (
            <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-md">
              <p className="font-bold">⚠️ FOR TESTING ONLY:</p>
              <p>Your OTP is: <span className="font-mono text-lg">{sentOTP}</span></p>
              <p className="text-xs mt-2">Remove this in production!</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOTP}>
              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">I am a *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['student', 'recruiter', 'admin'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, role }))}
                      className={`p-3 rounded-md border-2 font-semibold transition capitalize ${
                        formData.role === role
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.role === "student"
                    ? "Students must use @g.bracu.ac.bd email"
                    : "Recruiters and admins use regular email addresses"}
                </p>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={
                    formData.role === "student"
                      ? "yourname@g.bracu.ac.bd"
                      : "your.email@example.com"
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="At least 6 characters"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-600 hover:text-gray-800"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Re-enter your password"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-600 hover:text-gray-800"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
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
                {isSubmitting ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              {/* OTP Input */}
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">Enter OTP *</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  placeholder="123456"
                  maxLength="6"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                  disabled={isSubmitting}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  OTP sent to {formData.email}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-bold py-3 rounded-md transition ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed text-gray-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isSubmitting ? "Verifying..." : "Verify OTP & Register"}
              </button>

              {/* Resend OTP */}
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setError("");
                  setSuccess("");
                }}
                className="w-full mt-3 text-blue-600 hover:text-blue-800 font-semibold"
              >
                ← Back to Form
              </button>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPageWithOTP;
