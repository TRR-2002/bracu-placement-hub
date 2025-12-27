// src/pages/CompanyProfilePage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

// A helper component to render stars consistently
const RenderStars = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-5 h-5 ${
            i < Math.round(rating) ? "text-yellow-400" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.175 0l-3.366 2.446c-.784.57-1.838-.197-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
    </div>
  );
};

function CompanyProfilePage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const [reviewData, setReviewData] = useState({
    rating: 5,
    workCulture: 5,
    salary: 5,
    careerGrowth: 5,
    comment: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const [companyRes, reviewsRes, userRes] = await Promise.all([
        fetch(`http://localhost:1350/api/company/${companyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:1350/api/reviews/company/${companyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:1350/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const companyData = await companyRes.json();
      const reviewsData = await reviewsRes.json();
      const userData = await userRes.json();

      if (!companyRes.ok)
        throw new Error(companyData.error || "Failed to load company profile.");
      if (!reviewsRes.ok)
        throw new Error(reviewsData.error || "Failed to load reviews.");

      setCompany(companyData.company);
      setReviews(reviewsData.reviews || []);
      setStats(reviewsData.stats);
      if (userData.success) setUserInfo(userData.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const url = editingReviewId
        ? `http://localhost:1350/api/reviews/${editingReviewId}`
        : "http://localhost:1350/api/reviews/submit";
      const method = editingReviewId ? "PUT" : "POST";
      const body = editingReviewId ? reviewData : { companyId, ...reviewData };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      alert(
        data.message ||
          (editingReviewId
            ? "Review updated successfully!"
            : "Review submitted successfully!")
      );
      setShowReviewForm(false);
      setEditingReviewId(null);
      setReviewData({
        rating: 5,
        workCulture: 5,
        salary: 5,
        careerGrowth: 5,
        comment: "",
      });
      fetchData(); // Refresh all data
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </>
    );
  }
  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center text-red-500">
          {error}
        </div>
      </>
    );
  }
  if (!company) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          Company not found.
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 font-semibold hover:underline"
          >
            &larr; Back
          </button>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  {company.companyName}
                </h1>
                <p className="text-lg text-gray-500 mt-1">
                  {company.companyIndustry}
                </p>
                {stats && stats.totalReviews > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <RenderStars rating={stats.averageRating} />
                    <span className="font-bold text-gray-700">
                      {stats.averageRating.toFixed(1)}
                    </span>
                    <span className="text-gray-500">
                      ({stats.totalReviews} reviews)
                    </span>
                  </div>
                )}
              </div>
              {/* --- MODIFIED: Conditionally render the button --- */}
              {userInfo && userInfo.role === "student" && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 flex-shrink-0"
                >
                  Write Review
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-6 pt-6 border-t">
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-semibold">
                  {company.companyLocation || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Company Size</p>
                <p className="font-semibold">{company.companySize || "N/A"}</p>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="font-bold text-lg">About</h3>
              <p className="text-gray-600 mt-2">
                {company.companyDescription || "No description provided."}
              </p>
            </div>
          </div>

          {stats && stats.totalReviews > 0 && (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Rating Breakdown</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Overall</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.averageRating.toFixed(1)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Work Culture</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.averageWorkCulture.toFixed(1)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Salary</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.averageSalary.toFixed(1)}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Career Growth</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {stats.averageCareerGrowth.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Reviews</h2>
            <div className="space-y-8">
              {reviews.length > 0 ? (
                reviews.map((review, index) => (
                  <div
                    key={review._id}
                    className={
                      index < reviews.length - 1
                        ? "border-b last:border-b-0 pb-8"
                        : ""
                    }
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <RenderStars rating={review.rating} />
                      <span className="font-bold text-xl">
                        {review.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      by {review.reviewer?.name || "Anonymous"} •{" "}
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p>Work Culture</p>
                        <RenderStars rating={review.workCulture} />
                      </div>
                      <div>
                        <p>Salary</p>
                        <RenderStars rating={review.salary} />
                      </div>
                      <div>
                        <p>Career Growth</p>
                        <RenderStars rating={review.careerGrowth} />
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No reviews for this company yet. Be the first to write one!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingReviewId ? "Edit Your Review" : "Write a Review"}
              </h2>
              <button
                onClick={() => setShowReviewForm(false)}
                className="text-gray-600 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitReview}>
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Overall Rating
                </label>
                <select
                  value={reviewData.rating}
                  onChange={(e) =>
                    setReviewData({
                      ...reviewData,
                      rating: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} Star{n > 1 && "s"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    Work Culture
                  </label>
                  <select
                    value={reviewData.workCulture}
                    onChange={(e) =>
                      setReviewData({
                        ...reviewData,
                        workCulture: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    Salary
                  </label>
                  <select
                    value={reviewData.salary}
                    onChange={(e) =>
                      setReviewData({
                        ...reviewData,
                        salary: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    Career Growth
                  </label>
                  <select
                    value={reviewData.careerGrowth}
                    onChange={(e) =>
                      setReviewData({
                        ...reviewData,
                        careerGrowth: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">
                  Your Review
                </label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, comment: e.target.value })
                  }
                  placeholder="Share your experience working here..."
                  rows="6"
                  className="w-full p-3 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                >
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default CompanyProfilePage;
