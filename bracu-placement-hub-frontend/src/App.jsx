import React, { useState, useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function App() {
  const [tempToken, setTempToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { loginAction } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSimulateLogin = async () => {
    if (!tempToken.trim()) {
      return alert("Please paste a token from Postman.");
    }

    setIsLoading(true);
    try {
      // Decode the token to get the user's information
      const decodedUser = jwtDecode(tempToken);
      console.log("DECODED TOKEN PAYLOAD:", decodedUser);

      // Create the data object our loginAction expects
      const loginData = {
        token: tempToken,
        user: {
          userId: decodedUser.userId,
          name: decodedUser.name || "User",
        },
      };

      // Store token and userId in context and localStorage
      loginAction(loginData);
      localStorage.setItem("token", tempToken);
      localStorage.setItem("userId", decodedUser.userId);

      // Call the profile status endpoint to determine routing
      const response = await fetch("http://localhost:1350/api/profile/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tempToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile status");
      }

      const data = await response.json();
      console.log("Profile Status Response:", data);

      // Smart routing based on profile status
      if (data.hasProfile) {
        // Existing user with complete profile
        alert("Welcome back! Redirecting to your profile...");
        navigate(`/profile/view/${decodedUser.userId}`);
      } else {
        // New user or incomplete profile
        alert("Welcome! Let's create your profile...");
        navigate("/create-profile");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert(
        "An error occurred during login. Please check your token and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-4">Developer Token Login</h1>
        <p className="mb-4 text-gray-600">
          For development only. Log in via Postman and paste your token below.
        </p>
        <div className="space-y-4">
          <textarea
            value={tempToken}
            onChange={(e) => setTempToken(e.target.value)}
            placeholder="Paste your JWT token here"
            className="w-full p-2 border border-gray-300 rounded-md h-32"
            disabled={isLoading}
          />
          <button
            onClick={handleSimulateLogin}
            disabled={isLoading}
            className={`w-full font-bold py-2 rounded-md transition ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Processing..." : "Set Token & Enter App"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
