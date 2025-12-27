
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";  // ← ADD THIS

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
  
  // Review form
  const [reviewData, setReviewData] = useState({
    rating: 5,
    workCulture: 5,
    salary: 5,
    careerGrowth: 5,
    comment: "",
  });

  useEffect(() => {
    fetchCompanyData();
    fetchUserInfo();
  }, [companyId]);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:1350/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUserInfo(data.user);
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

  const fetchCompanyData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch company profile
      const companyResponse = await fetch(
        `http://localhost:1350/api/company/${companyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const companyData = await companyResponse.json();
      
      if (!companyResponse.ok) {
        throw new Error(companyData.error || "Failed to load company");
      }
      
      setCompany(companyData.company);
      
      // Fetch reviews
      const reviewsResponse = await fetch(
        `http://localhost:1350/api/reviews/company/${companyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const reviewsData = await reviewsResponse.json();
      if (reviewsResponse.ok) {
        setReviews(reviewsData.reviews);
        setStats(reviewsData.stats);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("token");
      
      if (editingReviewId) {
        // Edit existing review
        const response = await fetch(`http://localhost:1350/api/reviews/${editingReviewId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(reviewData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to update review");
        }

        alert("Review updated successfully!");
        setEditingReviewId(null);
      } else {
        // Create new review
        const response = await fetch("http://localhost:1350/api/reviews/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            companyId,
            ...reviewData,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to submit review");
        }

        if (data.moderated) {
          alert("Your review has been submitted and is under moderation.");
        } else {
          alert("Review submitted successfully!");
        }
      }
      
      setShowReviewForm(false);
      setReviewData({
        rating: 5,
        workCulture: 5,
        salary: 5,
        careerGrowth: 5,
        comment: "",
      });
      fetchCompanyData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review._id);
    setReviewData({
      rating: review.rating,
      workCulture: review.workCulture,
      salary: review.salary,
      careerGrowth: review.careerGrowth,
      comment: review.comment,
    });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:1350/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete review");
      }

      alert("Review deleted successfully!");
      fetchCompanyData();
    } catch (err) {
      alert(err.message);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={i < rating ? "text-yellow-500" : "text-gray-300"}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading company profile...</p>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600 mb-4">{error || "Company not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-semibold"
        >
          ← Back
        </button>

        {/* Company Info Card */}
        <div className="bg-white p-8 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {company.companyName || company.name}
              </h1>
              {company.companyIndustry && (
                <p className="text-lg text-gray-600">{company.companyIndustry}</p>
              )}
              {stats && stats.totalReviews > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-2xl">{renderStars(Math.round(stats.averageRating))}</span>
                  <span className="text-xl font-bold text-gray-800">
                    {stats.averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-600">
                    ({stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"})
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
            >
              Write Review
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {company.companyLocation && (
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold text-gray-800">{company.companyLocation}</p>
              </div>
            )}
            {company.companySize && (
              <div>
                <p className="text-sm text-gray-600">Company Size</p>
                <p className="font-semibold text-gray-800">{company.companySize}</p>
              </div>
            )}
          </div>

          {company.companyDescription && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-bold text-gray-800 mb-2">About</h3>
              <p className="text-gray-700 leading-relaxed">{company.companyDescription}</p>
            </div>
          )}
        </div>

        {/* Rating Breakdown */}
        {stats && stats.totalReviews > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Rating Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Overall</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.averageRating.toFixed(1)}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Work Culture</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.averageWorkCulture.toFixed(1)}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Salary</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.averageSalary.toFixed(1)}
                </p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Career Growth</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.averageCareerGrowth.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Write a Review</h2>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="text-gray-600 hover:text-gray-800 text-2xl"
                >
                  ×
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
                      setReviewData({ ...reviewData, rating: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} Star{n !== 1 ? "s" : ""}
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
                    <label className="block text-gray-700 font-bold mb-2">Salary</label>
                    <select
                      value={reviewData.salary}
                      onChange={(e) =>
                        setReviewData({ ...reviewData, salary: Number(e.target.value) })
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
                  />
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

        {/* Reviews List */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Reviews</h2>
          
          {reviews.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              No reviews yet. Be the first to review!
            </p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} className="border-b pb-6 last:border-b-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xl">{renderStars(review.rating)}</span>
                        <span className="font-bold text-lg">{review.rating}.0</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        by {review.reviewer?.name || "Anonymous"} •{" "}
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {review.flagged && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                        Flagged
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <p className="text-gray-600">Work Culture</p>
                      <p className="font-semibold">{renderStars(review.workCulture)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Salary</p>
                      <p className="font-semibold">{renderStars(review.salary)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Career Growth</p>
                      <p className="font-semibold">{renderStars(review.careerGrowth)}</p>
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

export default CompanyProfilePage;
