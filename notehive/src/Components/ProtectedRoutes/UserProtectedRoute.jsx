import React from "react";
import { Navigate } from "react-router-dom";

const UserProtectedRoute = ({ children }) => {
  const isLoggedIn =
    localStorage.getItem("isLoggedIn") === "true";

  const userRole =
    localStorage.getItem("userRole");

  // User login nahi hai
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Admin ko user pages access nahi karne dena
  if (userRole !== "user") {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return children;
};

export default UserProtectedRoute;