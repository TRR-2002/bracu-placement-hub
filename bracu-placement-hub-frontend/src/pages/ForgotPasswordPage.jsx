import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  //const [sentOTP, setSentOTP] = useState(""); // For testing only

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:1350/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      //setSentOTP(data.otp); // REMOVE IN PRODUCTION
      setSuccess("OTP sent to your email! Valid for 10 minutes.");
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    setError("");
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:1350/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p className="text-gray-600">
            {step === 1 && "Enter your email to receive OTP"}
            {step === 2 && "Verify the OTP sent to your email"}
            {step === 3 && "Set your new password"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              2
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              3
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span className="w-16 text-center">Email</span>
            <span className="w-16 text-center">Verify</span>
            <span className="w-16 text-center">Reset</span>
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

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP}>
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-md font-bold transition ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {isSubmitting ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div>
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength="6"
                  className="w-full p-3 border border-gray-300 rounded-md text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  OTP sent to {email}
                </p>
              </div>
              <button
                onClick={handleVerifyOTP}
                className="w-full py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-bold transition"
              >
                Verify OTP
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setError("");
                }}
                className="w-full mt-3 text-purple-600 hover:text-purple-800 font-semibold"
              >
                ← Back to Email
              </button>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-gray-600 hover:text-gray-800"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
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
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-md font-bold transition ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isSubmitting ? "Resetting Password..." : "Reset Password"}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-purple-600 hover:text-purple-800 font-semibold"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
