import React, { useState, useEffect } from "react";
import Home from "./components/Home";
import Auth from "./components/Auth";
import PatientDashboard from "./components/PatientDashboard";
import DoctorDashboard from "./components/DoctorDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { UserType } from "./types";
import { api } from "./lib/api";

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [currentView, setCurrentView] = useState<"home" | "login" | "register" | "dashboard">("home");
  const [appLoading, setAppLoading] = useState(true);

  const fetchSession = async () => {
    const token = localStorage.getItem("token");
    const storedUserData = localStorage.getItem("userData");

    if (token) {
      try {
        const res = await api.getCurrentUser();
        if (res.success && res.data) {
          setUser(res.data);
          setCurrentView("dashboard");
        } else {
          // Token expired or invalid
          handleLogout();
        }
      } catch (err) {
        console.error("Session verification error:", err);
        // Fallback to offline local storage cache if network is down
        if (storedUserData) {
          setUser(JSON.parse(storedUserData));
          setCurrentView("dashboard");
        }
      }
    }
    setAppLoading(false);
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleAuthSuccess = (userData: UserType) => {
    setUser(userData);
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setUser(null);
    setCurrentView("home");
  };

  const handleRefreshUser = async () => {
    try {
      const res = await api.getCurrentUser();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem("userData", JSON.stringify(res.data));
      }
    } catch (err) {
      console.error("Error refreshing user profile:", err);
    }
  };

  if (appLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider font-mono">Authenticating session...</span>
      </div>
    );
  }

  // Routing View
  if (currentView === "dashboard" && user) {
    if (user.type === "admin") {
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    } else if (user.isdoctor) {
      return <DoctorDashboard user={user} onLogout={handleLogout} onRefreshUser={handleRefreshUser} />;
    } else {
      return <PatientDashboard user={user} onLogout={handleLogout} onRefreshUser={handleRefreshUser} />;
    }
  }

  if (currentView === "login" || currentView === "register") {
    return (
      <Auth
        initialMode={currentView}
        onAuthSuccess={handleAuthSuccess}
        onBackToHome={() => setCurrentView("home")}
        onToggleMode={(mode) => setCurrentView(mode)}
      />
    );
  }

  return <Home onNav={(view) => setCurrentView(view)} />;
}
