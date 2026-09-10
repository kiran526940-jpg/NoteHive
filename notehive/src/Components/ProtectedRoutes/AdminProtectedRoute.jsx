import React from "react";
import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  const adminLoggedIn =
    localStorage.getItem("adminLoggedIn") === "true";

  // Admin login nahi hai
  if (!adminLoggedIn) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;