import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Add useNavigate
import { useAuth } from "../../contexts/AuthContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword, loading, error, clearError } = useAuth();
  const navigate = useNavigate(); // Add navigate hook

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Password reset failed:", err);
    }
  };

  // Add useEffect to handle automatic redirect after 3 seconds
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 3000);

      // Cleanup timer if component unmounts
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, navigate]);

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 mt-20">
          {/* Success Message */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-check text-white text-2xl"></i>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to:
            </p>
            <p className="text-lg font-medium text-blue-600 mb-6">{email}</p>
            {/* Add auto-redirect message */}
            <p className="text-gray-500">
              Redirecting to login page in 3 seconds...
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="fas fa-info-circle text-blue-400"></i>
                  </div>
                  <div className="ml-3 text-left">
                    <h3 className="text-sm font-medium text-blue-800">
                      What's next?
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Check your email inbox for the reset link</li>
                        <li>Click the link to create a new password</li>
                        <li>
                          Return to PETVERSE and sign in with your new password
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <p>Didn't receive the email? Check your spam folder or</p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                  }}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  try again with a different email address
                </button>
              </div>

              <div className="pt-4">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 mt-20">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-key text-white text-2xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Forgot Password?
          </h2>
          <p className="text-gray-600">
            No worries! Enter your email address and we'll send you a link to
            reset your password.
          </p>
        </div>

        {/* Reset Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="fas fa-exclamation-circle text-red-400"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-envelope text-gray-400"></i>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Send Reset Link
                  </>
                )}
              </button>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Login
              </Link>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
            <i className="fas fa-question-circle text-blue-500 mr-2"></i>
            Need Help?
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <i className="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <p>
                Make sure you're using the email address associated with your
                PETVERSE account
              </p>
            </div>
            <div className="flex items-start">
              <i className="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <p>Check your spam or junk folder if you don't see the email</p>
            </div>
            <div className="flex items-start">
              <i className="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <p>
                The reset link will expire after 1 hour for security reasons
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Still having trouble? Contact our support team at{" "}
              <a
                href="mailto:support@petverse.com"
                className="text-blue-600 hover:text-blue-500"
              >
                support@petverse.com
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2025 PETVERSE. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
