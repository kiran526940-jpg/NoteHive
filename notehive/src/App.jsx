
import React, { useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

// ======================================================
// COMMON / HOME
// ======================================================

import Header from "./Components/Header";
import Hero from "./Components/Hero";
import Features from "./Components/Features";
import Footer from "./Components/Footer";

// ======================================================
// AUTHENTICATION
// ======================================================

import Login from "./Components/Login";
import Signup from "./Components/Signup";

// ======================================================
// USER
// ======================================================

import Dashboard from "./Components/Dashboard";
import SaveAnywhere from "./Components/Dashboard/Saveanywhere";
import QuickSearch from "./Components/QuickSearch";
import CollaborativeSharing from "./Components/CollaborativeSharing";
import CustomWorkspace from "./Components/CustomWorkspace";
import SecureData from "./Components/SecureData";

import MyNotes from "./Components/MyNotes";
import PinnedNotes from "./Components/PinnedNotes";
import FavoriteNotes from "./Components/FavoriteNotes";

// ======================================================
// OTHER USER PAGES
// ======================================================

import GetStarted from "./Components/GetStarted";
import LearnMore from "./Components/LearnMore";
import About from "./Components/Dashboard/About";

import PrivacyPolicy from "./Components/Privacypolicy";
import Contacts from "./Components/Contact";
import Terms from "./Components/Terms";

import Settings from "./Components/Settings";
import Notifications from "./Components/Notifications";
import Chat from "./Components/Chat/Chat";

// ======================================================
// ADMIN
// ======================================================

import AdminLogin from "./Components/Dashboard/Admin/AdminLogin";
import AdminDashboard from "./Components/Dashboard/Admin/AdminDashboard";

import AdminPinnedNotes from "./Components/Dashboard/Admin/AdminPinnedNotes";
import AdminFavoriteNotes from "./Components/Dashboard/Admin/AdminFavoriteNotes";

import AdminReports from "./Components/Dashboard/Admin/AdminReports";
import AdminNotifications from "./Components/Dashboard/Admin/AdminNotifications";
import AdminProfile from "./Components/Dashboard/Admin/AdminProfile";

// ======================================================
// ⭐ ADMIN MOBILE FOOTER
// ======================================================

import AdminFooter from "./Components/Dashboard/Admin/AdminFooter";

// ======================================================
// ADMIN MANAGEMENT
// ======================================================

import ManageNotes from "./Components/ManageNotes";
import UserManagement from "./Components/ManageUsers";

// ======================================================
// OTHER
// ======================================================

import CreateNote from "./Components/CreateNote";
import ExploreNotes from "./Components/ExploreNotes";
import Profile from "./Components/Profile";

// ======================================================
// GLOBAL THEME MANAGER
// USER PAGES ONLY
// ======================================================

function ThemeManager() {
  const location = useLocation();

  useEffect(() => {
    const applyTheme = () => {
      const body = document.body;

      const isAdminRoute =
        location.pathname.startsWith("/admin") ||
        location.pathname === "/admin-login" ||
        location.pathname === "/admin-dashboard";

      body.classList.remove(
        "notehive-light",
        "notehive-dark"
      );

      // ADMIN PAGES PAR USER THEME APPLY NAHI HOGA
      if (isAdminRoute) {
        return;
      }

      let theme = "light";

      const savedSettings =
        localStorage.getItem("notehive_settings");

      if (savedSettings) {
        try {
          const settings =
            JSON.parse(savedSettings);

          theme =
            settings.appearance?.theme ||
            settings.theme ||
            "light";
        } catch (error) {
          console.error(
            "Theme settings error:",
            error
          );
        }
      }

      // SYSTEM THEME
      if (theme === "system") {
        const prefersDark =
          window.matchMedia &&
          window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches;

        body.classList.add(
          prefersDark
            ? "notehive-dark"
            : "notehive-light"
        );

        return;
      }

      // DARK
      if (theme === "dark") {
        body.classList.add(
          "notehive-dark"
        );

        return;
      }

      // LIGHT
      body.classList.add(
        "notehive-light"
      );
    };

    applyTheme();

    // STORAGE EVENT
    const handleStorageChange = (event) => {
      if (
        event.key ===
        "notehive_settings"
      ) {
        applyTheme();
      }
    };

    // SAME TAB EVENT
    const handleThemeChange = () => {
      applyTheme();
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    window.addEventListener(
      "notehive-theme-change",
      handleThemeChange
    );

    // SYSTEM THEME
    const mediaQuery =
      window.matchMedia &&
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    const handleSystemThemeChange = () => {
      const isAdminRoute =
        location.pathname.startsWith("/admin") ||
        location.pathname === "/admin-login" ||
        location.pathname === "/admin-dashboard";

      if (isAdminRoute) {
        return;
      }

      const savedSettings =
        localStorage.getItem(
          "notehive_settings"
        );

      if (!savedSettings) {
        return;
      }

      try {
        const settings =
          JSON.parse(savedSettings);

        const currentTheme =
          settings.appearance?.theme ||
          settings.theme;

        if (currentTheme === "system") {
          applyTheme();
        }
      } catch (error) {
        console.error(
          "System theme error:",
          error
        );
      }
    };

    if (mediaQuery) {
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener(
          "change",
          handleSystemThemeChange
        );
      } else {
        mediaQuery.addListener(
          handleSystemThemeChange
        );
      }
    }

    // CLEANUP
    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );

      window.removeEventListener(
        "notehive-theme-change",
        handleThemeChange
      );

      if (mediaQuery) {
        if (
          mediaQuery.removeEventListener
        ) {
          mediaQuery.removeEventListener(
            "change",
            handleSystemThemeChange
          );
        } else {
          mediaQuery.removeListener(
            handleSystemThemeChange
          );
        }
      }
    };
  }, [location.pathname]);

  return null;
}

// ======================================================
// USER LAYOUT
// ======================================================

function UserLayout({ children }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

// ======================================================
// ⭐ ADMIN LAYOUT
// FOOTER YAHAN SE SHOW HOGA
// ======================================================

function AdminLayout({ children }) {
  return (
    <>
      {children}

      {/* ⭐ MOBILE ADMIN FOOTER */}
      <AdminFooter />
    </>
  );
}

// ======================================================
// ADMIN LOGIN LAYOUT
// ❌ FOOTER NAHI HOGA
// ======================================================

function AdminLoginLayout({ children }) {
  return (
    <>
      {children}
    </>
  );
}

// ======================================================
// USER PROTECTED ROUTE
// ======================================================

function UserProtectedRoute({
  children,
}) {
  const isLoggedIn =
    localStorage.getItem(
      "isLoggedIn"
    ) === "true";

  const userRole =
    localStorage.getItem(
      "userRole"
    );

  // ADMIN KO ADMIN DASHBOARD PAR BHEJO
  if (userRole === "admin") {
    return (
      <Navigate
        to="/admin-dashboard"
        replace
      />
    );
  }

  // LOGIN CHECK
  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

// ======================================================
// ADMIN PROTECTED ROUTE
// ======================================================

function AdminProtectedRoute({
  children,
}) {
  const adminLoggedIn =
    localStorage.getItem(
      "adminLoggedIn"
    ) === "true";

  const userRole =
    localStorage.getItem(
      "userRole"
    );

  if (
    !adminLoggedIn ||
    userRole !== "admin"
  ) {
    return (
      <Navigate
        to="/admin-login"
        replace
      />
    );
  }

  return children;
}

// ======================================================
// APP
// ======================================================

function App() {
  return (
    <BrowserRouter>

      {/* GLOBAL USER THEME */}
      <ThemeManager />

      <Routes>

        {/* ==================================================
            HOME
        ================================================== */}

        <Route
          path="/"
          element={
            <UserLayout>
              <>
                <Hero />
                <Features />
                <Footer />
              </>
            </UserLayout>
          }
        />

        {/* ==================================================
            LOGIN
        ================================================== */}

        <Route
          path="/login"
          element={
            <UserLayout>
              <Login />
            </UserLayout>
          }
        />

        {/* ==================================================
            SIGNUP
        ================================================== */}

        <Route
          path="/signup"
          element={
            <UserLayout>
              <Signup />
            </UserLayout>
          }
        />

        {/* ==================================================
            USER DASHBOARD
        ================================================== */}

        <Route
          path="/dashboard"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <Dashboard />
              </UserLayout>
            </UserProtectedRoute>
          }
        />

        {/* ==================================================
            MY NOTES
        ================================================== */}

        <Route
          path="/my-notes"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <MyNotes />
              </UserLayout>
            </UserProtectedRoute>
          }
        />

        {/* ==================================================
            CREATE NOTE
        ================================================== */}

        <Route
          path="/create-note"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <CreateNote />
              </UserLayout>
            </UserProtectedRoute>
          }
        />

        {/* ==================================================
            EXPLORE NOTES
        ================================================== */}

        <Route
          path="/explore-notes"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <ExploreNotes />
              </UserLayout>
            </UserProtectedRoute>
          }
        />

        {/* ==================================================
            PINNED NOTES
        ================================================== */}

        <Route
          path="/pinned-notes"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <PinnedNotes />
              </UserLayout>
            </UserProtectedRoute>
          }
        />

        {/* ==================================================
            FAVORITE NOTES
        ================================================== */}

        <Route
          path="/favorite-notes"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <FavoriteNotes />
              </UserLayout>
            </UserProtectedRoute>
          }
        />

        {/* ==================================================
            SAVE ANYWHERE
        ================================================== */}

        <Route
          path="/save-anywhere"
          element={
            <UserLayout>
              <SaveAnywhere />
            </UserLayout>
          }
        />

        {/* ==================================================
            QUICK SEARCH
        ================================================== */}

        <Route
          path="/quick-search"
          element={
            <UserLayout>
              <QuickSearch />
            </UserLayout>
          }
        />

        {/* ==================================================
            COLLABORATIVE SHARING
        ================================================== */}

        <Route
          path="/collaborative-sharing"
          element={
            <UserLayout>
              <CollaborativeSharing />
            </UserLayout>
          }
        />

        {/* ==================================================
            PROFILE
        ================================================== */}

        <Route
          path="/Profile"
          element={
            <UserLayout>
              <Profile />
            </UserLayout>
          }
        />

        {/* ==================================================
            CUSTOM WORKSPACE
        ================================================== */}

        <Route
          path="/custom-workspace"
          element={
            <UserLayout>
              <CustomWorkspace />
            </UserLayout>
          }
        />

        {/* ==================================================
            SECURE DATA
        ================================================== */}

        <Route
          path="/secure-data"
          element={
            <UserLayout>
              <SecureData />
            </UserLayout>
          }
        />

        {/* ==================================================
            GET STARTED
        ================================================== */}

        <Route
          path="/get-started"
          element={
            <UserLayout>
              <GetStarted />
            </UserLayout>
          }
        />

        {/* ==================================================
            LEARN MORE
        ================================================== */}

        <Route
          path="/learn-more"
          element={
            <UserLayout>
              <LearnMore />
            </UserLayout>
          }
        />

        {/* ==================================================
            ABOUT
        ================================================== */}

        <Route
          path="/about"
          element={
            <UserLayout>
              <About />
            </UserLayout>
          }
        />

        {/* ==================================================
            CONTACT
        ================================================== */}

        <Route
          path="/contacts"
          element={
            <UserLayout>
              <Contacts />
            </UserLayout>
          }
        />

        {/* ==================================================
            PRIVACY POLICY
        ================================================== */}

        <Route
          path="/privacy-policy"
          element={
            <UserLayout>
              <PrivacyPolicy />
            </UserLayout>
          }
        />

        {/* ==================================================
            TERMS
        ================================================== */}

        <Route
          path="/terms"
          element={
            <UserLayout>
              <Terms />
            </UserLayout>
          }
        />

        {/* ==================================================
            SETTINGS
        ================================================== */}

        <Route
          path="/settings"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <Settings />
              </UserLayout>
            </UserProtectedRoute>
          }
        />

        {/* ==================================================
            USER NOTIFICATIONS
        ================================================== */}

        <Route
          path="/notifications"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <Notifications />
              </UserLayout>
            </UserProtectedRoute>
          }
        />

        {/* ==================================================
            💬 USER CHAT
        ================================================== */}

        <Route
          path="/chat"
          element={
            <UserProtectedRoute>
              <UserLayout>
                <Chat />
              </UserLayout>
            </UserProtectedRoute>
          }
        />

        {/* ==================================================
            ADMIN LOGIN
            ❌ FOOTER NAHI
        ================================================== */}

        <Route
          path="/admin-login"
          element={
            <AdminLoginLayout>
              <AdminLogin />
            </AdminLoginLayout>
          }
        />

        {/* ==================================================
            ADMIN DASHBOARD
            ✅ FOOTER
        ================================================== */}

        <Route
          path="/admin-dashboard"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />

        {/* ==================================================
            ADMIN PROFILE
            ✅ FOOTER
        ================================================== */}

        <Route
          path="/admin/profile"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminProfile />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />

        {/* ==================================================
            ADMIN PINNED NOTES
            ✅ FOOTER
        ================================================== */}

        <Route
          path="/admin/pinned-notes"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminPinnedNotes />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />

        {/* ==================================================
            ADMIN FAVORITE NOTES
            ✅ FOOTER
        ================================================== */}

        <Route
          path="/admin/favorite-notes"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminFavoriteNotes />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />

        {/* ==================================================
            ADMIN NOTIFICATIONS
            ✅ FOOTER
        ================================================== */}

        <Route
          path="/admin/notifications"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminNotifications />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />

        {/* ==================================================
            ADMIN REPORTS
            ✅ FOOTER
        ================================================== */}

        <Route
          path="/admin/reports"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminReports />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />

        {/* ==================================================
            ADMIN MANAGE NOTES
            ✅ FOOTER
        ================================================== */}

        <Route
          path="/admin/manage-notes"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <ManageNotes />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />

        {/* ==================================================
            ADMIN MANAGE USERS
            ✅ FOOTER
        ================================================== */}

        <Route
          path="/admin/manage-users"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />

        {/* ==================================================
            404
        ================================================== */}

        <Route
          path="*"
          element={
            <div
              style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                fontFamily:
                  "Arial, sans-serif",
              }}
            >
              <h1
                style={{
                  fontSize: "80px",
                  margin: 0,
                }}
              >
                404
              </h1>

              <h2>
                Page Not Found
              </h2>

              <p>
                The page you are looking for
                does not exist.
              </p>

              <button
                onClick={() =>
                  (window.location.href = "/")
                }
                style={{
                  padding: "12px 25px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Go Home
              </button>
            </div>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
