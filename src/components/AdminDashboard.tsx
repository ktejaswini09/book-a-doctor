import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "../lib/api";
import { UserType, DoctorType, AppointmentType } from "../types";
import { 
  Users, Stethoscope, Calendar, CheckCircle, ShieldAlert, XCircle, 
  Clock, Trash2, Shield, Mail, Phone, LogOut, Award, Briefcase, DollarSign, MapPin
} from "lucide-react";

interface AdminDashboardProps {
  user: UserType;
  onLogout: () => void;
}

type TabType = "users" | "doctors" | "appointments";

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [users, setUsers] = useState<UserType[]>([]);
  const [doctors, setDoctors] = useState<DoctorType[]>([]);
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, dRes, aRes] = await Promise.all([
        api.adminGetAllUsers(),
        api.adminGetAllDoctors(),
        api.adminGetAllAppointments(),
      ]);

      if (uRes.success) setUsers(uRes.data);
      if (dRes.success) setDoctors(dRes.data);
      if (aRes.success) setAppointments(aRes.data);
    } catch (err) {
      console.error("Error loading admin lists:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Doctor Application Approval
  const handleApprove = async (doctorId: string, userId: string) => {
    setActionLoading(doctorId);
    try {
      const res = await api.adminApproveDoctor(doctorId, userId);
      if (res.success) {
        loadData();
      }
    } catch (err) {
      console.error("Error approving doctor:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Doctor Application Rejection
  const handleReject = async (doctorId: string, userId: string) => {
    setActionLoading(doctorId);
    try {
      const res = await api.adminRejectDoctor(doctorId, userId);
      if (res.success) {
        loadData();
      }
    } catch (err) {
      console.error("Error rejecting doctor:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Calculations for KPI dashboard cards
  const totalPatients = users.filter((u) => u.type !== "admin").length;
  const pendingDoctorApplications = doctors.filter((d) => d.status === "pending").length;
  const totalAppointments = appointments.length;

  return (
    <div id="admin-dashboard" className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-left text-slate-800">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white leading-none">MedicareBook</h1>
            <span className="text-[11px] text-slate-500 font-medium font-mono">ADMIN PANEL</span>
          </div>
        </div>

        {/* Admin Quick Info */}
        <div className="p-4 mx-4 my-3 bg-slate-850 bg-slate-800/40 rounded-2xl flex items-center gap-3 border border-slate-800">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
            AD
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-white truncate leading-tight">{user.fullName}</h4>
            <p className="text-[11px] text-emerald-400 truncate mt-0.5 font-semibold">Super Admin</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "users" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10" : "hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>Manage Users</span>
          </button>

          <button
            onClick={() => setActiveTab("doctors")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "doctors" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10" : "hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Stethoscope className="w-4.5 h-4.5" />
              <span>Doctor Verification</span>
            </div>
            {pendingDoctorApplications > 0 && (
              <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                {pendingDoctorApplications}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("appointments")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "appointments" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10" : "hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Calendar className="w-4.5 h-4.5" />
            <span>Global Appointments</span>
          </button>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/30 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* KPI Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">Total Platform Users</span>
                  <span className="text-2xl font-black text-slate-900">{users.length}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">Pending Doctor Apps</span>
                  <span className="text-2xl font-black text-slate-900">{pendingDoctorApplications}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">System Appointments</span>
                  <span className="text-2xl font-black text-slate-900">{totalAppointments}</span>
                </div>
              </div>
            </div>

            {/* Users list Tab */}
            {activeTab === "users" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Platform Users Directory</h2>
                  <p className="text-sm text-slate-600">Track and view all registered patient and administrative credentials.</p>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-600 tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Email Address</th>
                          <th className="px-6 py-4">System Role</th>
                          <th className="px-6 py-4">Listing Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {users.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{u.fullName}</td>
                            <td className="px-6 py-4 font-mono text-xs">{u.email}</td>
                            <td className="px-6 py-4 font-semibold capitalize">{u.type}</td>
                            <td className="px-6 py-4">
                              {u.isdoctor ? (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full">
                                  Listed Doctor
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                                  Standard Patient
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Doctors Verification Tab */}
            {activeTab === "doctors" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Doctor Applications Board</h2>
                  <p className="text-sm text-slate-600">Approve clinical credentials and authorize doctor schedules on the platform.</p>
                </div>

                {doctors.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
                    <p className="text-slate-500 text-sm">No doctor applications are currently registered.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {doctors.map((doc) => (
                      <div key={doc._id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between border-b border-slate-50 pb-3.5 mb-4">
                            <div>
                              <h3 className="font-bold text-slate-900 text-base">Dr. {doc.fullName}</h3>
                              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                                {doc.specialization}
                              </span>
                            </div>

                            <div>
                              {doc.status === "pending" && (
                                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-full uppercase">Pending Review</span>
                              )}
                              {doc.status === "approved" && (
                                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full uppercase">Approved</span>
                              )}
                              {doc.status === "rejected" && (
                                <span className="px-2.5 py-0.5 bg-red-50 text-red-800 text-[10px] font-bold rounded-full uppercase">Rejected</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 text-xs text-slate-600 mb-6">
                            <p className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <span className="font-mono">{doc.email}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-400" />
                              <span>{doc.phone}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-slate-400" />
                              <span>{doc.experience} Years Experience</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-slate-400" />
                              <span>Consultation Fees: ${doc.fees}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span>{doc.address}</span>
                            </p>
                          </div>
                        </div>

                        {doc.status === "pending" && (
                          <div className="border-t border-slate-50 pt-4 flex gap-3">
                            <button
                              onClick={() => handleApprove(doc._id, doc.userId)}
                              disabled={actionLoading === doc._id}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReject(doc._id, doc.userId)}
                              disabled={actionLoading === doc._id}
                              className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center cursor-pointer"
                            >
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Global Appointments Tab */}
            {activeTab === "appointments" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Global Appointments</h2>
                  <p className="text-sm text-slate-600">Overview of all diagnostics scheduled through MedicareBook.</p>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-600 tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Patient</th>
                          <th className="px-6 py-4">Doctor</th>
                          <th className="px-6 py-4">Specialization</th>
                          <th className="px-6 py-4">Scheduled Date</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {appointments.map((app) => (
                          <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{app.userInfo?.fullName || "Patient"}</td>
                            <td className="px-6 py-4 font-semibold text-slate-800">Dr. {app.doctorInfo?.fullName || "Doctor"}</td>
                            <td className="px-6 py-4">{app.doctorInfo?.specialization}</td>
                            <td className="px-6 py-4 font-mono text-xs">{app.date}</td>
                            <td className="px-6 py-4">
                              {app.status === "pending" && (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-full uppercase">Pending</span>
                              )}
                              {app.status === "approved" && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full uppercase">Approved</span>
                              )}
                              {app.status === "rejected" && (
                                <span className="px-2 py-0.5 bg-red-50 text-red-800 text-[10px] font-bold rounded-full uppercase">Rejected</span>
                              )}
                              {app.status === "completed" && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded-full uppercase">Completed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
