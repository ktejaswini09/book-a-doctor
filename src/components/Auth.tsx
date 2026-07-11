import React, { useState } from "react";
import { motion } from "motion/react";
import { api } from "../lib/api";
import { Stethoscope, Lock, Mail, User, Phone, CheckCircle, ShieldAlert, ArrowLeft } from "lucide-react";

interface AuthProps {
  initialMode: "login" | "register";
  onAuthSuccess: (user: any) => void;
  onBackToHome: () => void;
  onToggleMode: (mode: "login" | "register") => void;
}

export default function Auth({ initialMode, onAuthSuccess, onBackToHome, onToggleMode }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<"user" | "admin">("user");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (initialMode === "login") {
        const data = await api.login({ email, password });
        if (data.success) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("userData", JSON.stringify(data.userData));
          setSuccessMsg("Logged in successfully! Loading your dashboard...");
          setTimeout(() => {
            onAuthSuccess(data.userData);
          }, 1000);
        } else {
          setErrorMsg(data.message || "Invalid credentials");
        }
      } else {
        const data = await api.register({
          fullName,
          email,
          password,
          phone,
          type,
        });
        if (data.success) {
          setSuccessMsg("Account registered successfully! Redirecting to login...");
          setTimeout(() => {
            onToggleMode("login");
            setErrorMsg("");
            setSuccessMsg("");
          }, 1500);
        } else {
          setErrorMsg(data.message || "Registration failed. Try a different email.");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setErrorMsg("Unable to connect to the server. Please verify connections.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative text-left">
      {/* Back button */}
      <div className="absolute top-6 left-6">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 bg-emerald-50 rounded-2xl mb-4 text-emerald-600">
          <Stethoscope className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">
          {initialMode === "login" ? "Welcome back" : "Create an account"}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {initialMode === "login" ? (
            <>
              Or{" "}
              <button
                onClick={() => {
                  onToggleMode("register");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors cursor-pointer"
              >
                start scheduling by registering today
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  onToggleMode("login");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors cursor-pointer"
              >
                Sign In instead
              </button>
            </>
          )}
        </p>
      </div>

      <motion.div
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white py-8 px-4 border border-slate-100 rounded-3xl shadow-xl sm:px-10">
          {/* Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm flex items-start gap-2.5 animate-pulse">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Registration specific fields */}
            {initialMode === "register" && (
              <>
                <div>
                  <label htmlFor="fullname" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="1234567890"
                      className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Select Platform Role
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer text-sm font-medium transition-all ${type === "user" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}>
                      <input
                        type="radio"
                        name="role"
                        value="user"
                        checked={type === "user"}
                        onChange={() => setType("user")}
                        className="sr-only"
                      />
                      <span>Regular Patient</span>
                    </label>
                    <label className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer text-sm font-medium transition-all ${type === "admin" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}>
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={type === "admin"}
                        onChange={() => setType("admin")}
                        className="sr-only"
                      />
                      <span>Administrator</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
                  Password
                </label>
                {initialMode === "login" && (
                  <span className="text-xs text-slate-400">Default admin: admin@medicare.com / admin123</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-600/50 rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 active:shadow-emerald-600/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{initialMode === "login" ? "Sign In" : "Register Account"}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
