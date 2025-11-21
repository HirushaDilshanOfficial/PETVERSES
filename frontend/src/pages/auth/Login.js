import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { clearAuthData } from "../../utils/clearAuth";
import toast from "react-hot-toast";
import Header from "../../components/Header"; // Import the Header component

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const { signin, loading, error, clearError, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form validation
  useEffect(() => {
    const isValid =
      formData.email.includes("@") && formData.password.length >= 6;
    setIsFormValid(isValid);
  }, [formData]);

  const validateField = (name, value) => {
    switch (name) {
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Please enter a valid email address";
        return "";
      case "password":
        if (!value) return "Password is required";
        if (value.length < 6)
          return "Password must be at least 6 characters long";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (error) clearError();
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      clearAuthData();
      const response = await signin(formData.email, formData.password);

      if (response && response.user) {
        // Show success message
        toast.success("Login successful! Redirecting...", {
          duration: 2000,
        });

        const role = response.user.role;
        const roleRedirects = {
          admin: "/admin/dashboard",
          serviceProvider: "/dashboard/service-provider",
          petOwner: "/", // Redirect pet owners to home page
        };

        const redirectPath = roleRedirects[role] || "/";
        // Add a small delay to allow toast to be seen
        setTimeout(() => {
          navigate(redirectPath);
        }, 2000);
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login failed:", err);
      // Show error message with toast
      const toastId = toast.error(
        err.message || "Login failed. Please try again.",
        {
          duration: 3000, // Show for 3 seconds
        }
      );

      // Automatically remove the error toast after 3 seconds
      setTimeout(() => {
        toast.remove(toastId);
      }, 3000);
    }
  };

  useEffect(() => {
    const fromLogout = location.state?.fromLogout;

    if (user && !fromLogout) {
      const roleRedirects = {
        admin: "/admin/dashboard",
        serviceProvider: "/dashboard/service-provider",
        petOwner: "/", // Redirect pet owners to home page
      };

      const redirectPath = roleRedirects[user.role] || "/";
      navigate(redirectPath);
    }
  }, [user, navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50">
      {/* Add the Header component */}
      <header />
      {/* Split layout container */}
      <div className="flex w-full max-w-6xl mx-auto rounded-2xl shadow-xl overflow-hidden mt-20">
        {/* Image side - left */}
        <div className="hidden md:flex md:w-1/2 relative">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80')",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 to-indigo-900/60"></div>

          {/* Decorative elements on image side */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-400/20 rounded-full blur-xl"></div>

          {/* Text overlay on image */}
          <div className="relative z-10 flex flex-col justify-end p-12 text-white h-full">
            <div className="max-w-md">
              <h2 className="text-4xl font-bold mb-4">Welcome to PETVERSE</h2>
              <p className="text-xl opacity-90">
                Your one-stop destination for all things pet care
              </p>
            </div>
          </div>
        </div>

        {/* Login form side - right */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-12 relative">
          {/* Decorative elements on form side */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 flex flex-col justify-center h-full">
            {/* Header with branding */}
            <div className="text-center mb-10">
              <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <span className="text-white text-2xl">🐾</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Sign in to your{" "}
                <span className="font-semibold text-blue-600">PETVERSE</span>{" "}
                account
              </p>
            </div>

            {/* Back button */}
            <div className="mb-6">
              <button
                onClick={() => navigate("/")}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Home
              </button>
            </div>

            {/* Login form */}
            <div className="space-y-6">
              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Email field */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className={`h-5 w-5 ${
                          focusedField === "email"
                            ? "text-blue-500"
                            : "text-gray-400"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      // Changed to white background with blue border
                      className={`block w-full pl-10 pr-4 py-3 bg-white border-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-colors ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={() => setFocusedField("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className={`h-5 w-5 ${
                          focusedField === "password"
                            ? "text-blue-500"
                            : "text-gray-400"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      // Changed to white background with blue border
                      className={`block w-full pl-10 pr-12 py-3 bg-white border-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-colors ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={() => setFocusedField("password")}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          {showPassword ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l4.242 4.242M9.88 9.88L3 3m6.88 6.88L21 21"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Forgot password link */}
                <div className="flex items-center justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit button */}
                <div>
                  <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Signing you in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
              </form>

              {/* Sign up link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  New to PETVERSE?{" "}
                  <Link
                    to="/signup"
                    className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Create your account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
