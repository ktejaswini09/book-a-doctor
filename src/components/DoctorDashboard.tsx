import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "../lib/api";
import { UserType, DoctorType, AppointmentType } from "../types";
import { 
  Calendar, FileText, Bell, Sparkles, User, CheckCircle, Clock, XCircle, 
  Stethoscope, MapPin, DollarSign, Briefcase, ChevronRight, Edit2, Download, 
  Award, Heart, Clipboard, LogOut, Check, Save, MessageSquare
} from "lucide-react";

interface DoctorDashboardProps {
  user: UserType;
  onLogout: () => void;
  onRefreshUser: () => Promise<void>;
}

type TabType = "appointments" | "profile" | "notifications";

export default function DoctorDashboard({ user, onLogout, onRefreshUser }: DoctorDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("appointments");
  const [doctorProfile, setDoctorProfile] = useState<DoctorType | null>(null);
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(false);

  // Profile Edit State
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editSpecialization, setEditSpecialization] = useState("");
  const [editExperience, setEditExperience] = useState("");
  const [editFees, setEditFees] = useState("");
  const [editTimingsStart, setEditTimingsStart] = useState("");
  const [editTimingsEnd, setEditTimingsEnd] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  // Conclude Appointment Modal
  const [concludingApp, setConcludingApp] = useState<AppointmentType | null>(null);
  const [consultationNotes, setConsultationNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);

  // Filter
  const [appointmentFilter, setAppointmentFilter] = useState<"all" | "pending" | "approved" | "completed">("all");

  const loadDoctorProfileAndAppointments = async () => {
    try {
      setLoading(true);
      // 1. Get all doctor records to find the profile associated with current user
      const doctorsRes = await api.adminGetAllDoctors();
      if (doctorsRes.success) {
        const profile = doctorsRes.data.find((d: any) => d.userId === user._id);
        if (profile) {
          setDoctorProfile(profile);
          setEditFullName(profile.fullName);
          setEditPhone(profile.phone);
          setEditAddress(profile.address);
          setEditSpecialization(profile.specialization);
          setEditExperience(profile.experience);
          setEditFees(profile.fees.toString());
          setEditTimingsStart(profile.timings?.start || "09:00");
          setEditTimingsEnd(profile.timings?.end || "17:00");
        }
      }

      // 2. Get appointments
      const apptRes = await api.doctorGetAppointments();
      if (apptRes.success) {
        setAppointments(apptRes.data);
      }
    } catch (err) {
      console.error("Error loading doctor data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorProfileAndAppointments();
  }, [user]);

  // Profile Update Submission
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorProfile) return;

    setProfileSaving(true);
    setProfileSuccessMsg("");
    try {
      const res = await api.doctorUpdateProfile({
        fullName: editFullName,
        phone: editPhone,
        address: editAddress,
        specialization: editSpecialization,
        experience: editExperience,
        fees: Number(editFees),
        timings: {
          start: editTimingsStart,
          end: editTimingsEnd,
        },
      });

      if (res.success) {
        setProfileSuccessMsg("Professional profile updated successfully!");
        loadDoctorProfileAndAppointments();
        setTimeout(() => setProfileSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setProfileSaving(false);
    }
  };

  // Appointment Actions
  const handleStatusChange = async (appointmentId: string, status: "approved" | "rejected") => {
    try {
      const res = await api.doctorHandleAppointmentStatus(appointmentId, status);
      if (res.success) {
        loadDoctorProfileAndAppointments();
      }
    } catch (err) {
      console.error("Error updating appointment status:", err);
    }
  };

  // Conclude/Complete Appointment with Notes
  const handleConcludeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concludingApp) return;

    setNotesSaving(true);
    try {
      const res = await api.doctorHandleAppointmentStatus(concludingApp._id, "completed", consultationNotes);
      if (res.success) {
        setConcludingApp(null);
        setConsultationNotes("");
        loadDoctorProfileAndAppointments();
      }
    } catch (err) {
      console.error("Error concluding appointment:", err);
    } finally {
      setNotesSaving(false);
    }
  };

  // Mark all read
  const handleMarkAllRead = async () => {
    try {
      const res = await api.markAllNotificationsRead(user._id);
      if (res.success) {
        await onRefreshUser();
      }
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  // Clear notifications
  const handleDeleteAllNotifications = async () => {
    try {
      const res = await api.deleteAllNotifications(user._id);
      if (res.success) {
        await onRefreshUser();
      }
    } catch (err) {
      console.error("Error deleting notifications:", err);
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter((app) => {
    if (appointmentFilter === "all") return true;
    return app.status === appointmentFilter;
  });

  const unreadCount = user.notification?.length || 0;

  return (
    <div id="doctor-dashboard" className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-left text-slate-800">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-900">
        <div className="p-6 border-b border-slate-900 flex items-center gap-3">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white leading-none">MedicareBook</h1>
            <span className="text-[11px] text-slate-500 font-medium">DOCTOR PORTAL</span>
          </div>
        </div>

        {/* Doctor Quick Info */}
        <div className="p-4 mx-4 my-3 bg-slate-900/65 rounded-2xl flex items-center gap-3 border border-slate-900">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
            DR
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-white truncate leading-tight">Dr. {user.fullName}</h4>
            <p className="text-[11px] text-emerald-400 truncate mt-0.5 capitalize">{doctorProfile?.specialization || "Physician"}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "appointments" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10" : "hover:bg-slate-900/50 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Clipboard className="w-4.5 h-4.5" />
              <span>Appointment Board</span>
            </div>
            {appointments.length > 0 && (
              <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                {appointments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "profile" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10" : "hover:bg-slate-900/50 hover:text-white"
            }`}
          >
            <Edit2 className="w-4.5 h-4.5" />
            <span>Clinic Settings</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "notifications" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10" : "hover:bg-slate-900/50 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4.5 h-4.5" />
              <span>Patient Alerts</span>
            </div>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-900">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-900/30 rounded-xl text-sm font-semibold transition-all cursor-pointer"
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
          >
            {/* Active profile review if not approved */}
            {doctorProfile && doctorProfile.status !== "approved" && (
              <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Professional Verification Pending</h4>
                  <p className="text-xs text-slate-600 mt-0.5">Your listing status is currently <strong>{doctorProfile.status}</strong>. Patients will be able to browse and book appointments once platform administrators complete credential reviews.</p>
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === "appointments" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Diagnostic Appointment Board</h2>
                  <p className="text-sm text-slate-600">Analyze patient cases, review clinical history files, and prescribe follow-up treatments.</p>
                </div>

                {/* Filter Controls */}
                <div className="flex gap-2 bg-white p-2 border border-slate-100 rounded-xl shadow-sm w-fit">
                  {(["all", "pending", "approved", "completed"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAppointmentFilter(filter)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                        appointmentFilter === filter ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Grid layout of appointments */}
                {filteredAppointments.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
                    <p className="text-slate-500 text-sm">No appointments found matching the "{appointmentFilter}" status filter.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredAppointments.map((app) => (
                      <div key={app._id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between border-b border-slate-50 pb-3 mb-4">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Scheduled Visit</span>
                              <h3 className="font-bold text-slate-900 text-base mt-0.5">{app.userInfo?.fullName || "Patient"}</h3>
                              <p className="text-xs text-slate-500 mt-0.5">{app.userInfo?.email} • {app.userInfo?.phone}</p>
                            </div>

                            <div className="text-right">
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                {app.date}
                              </span>
                            </div>
                          </div>

                          {/* Patient documents */}
                          {app.document ? (
                            <div className="mb-4 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span className="text-xs font-medium text-slate-700 truncate">{app.document.filename}</span>
                              </div>
                              <a
                                href={api.doctorDownloadDocumentUrl(app._id)}
                                download
                                className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </a>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 mb-4 italic">No file records uploaded by patient</p>
                          )}

                          {/* Action Notes if Completed */}
                          {app.status === "completed" && app.notes && (
                            <div className="mb-4 p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl text-xs">
                              <span className="font-bold text-blue-900 block mb-0.5">Written Prescriptions:</span>
                              <p className="text-slate-600 leading-relaxed">{app.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Booking Controls */}
                        <div className="border-t border-slate-50 pt-4 flex gap-3">
                          {app.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleStatusChange(app._id, "approved")}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve booking</span>
                              </button>
                              <button
                                onClick={() => handleStatusChange(app._id, "rejected" as any)}
                                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center cursor-pointer"
                              >
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {app.status === "approved" && (
                            <button
                              onClick={() => setConcludingApp(app)}
                              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Clipboard className="w-3.5 h-3.5" />
                              <span>Conclude & Prescribe Notes</span>
                            </button>
                          )}

                          {app.status === "rejected" && (
                            <span className="text-xs text-red-500 font-semibold">Appointment Rejected</span>
                          )}

                          {app.status === "completed" && (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Treatment Completed</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Clinical Settings</h2>
                  <p className="text-sm text-slate-600">Control active office locations, consulting fees, and timing ranges.</p>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm max-w-3xl">
                  {profileSuccessMsg && (
                    <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm flex items-center gap-2.5">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span>{profileSuccessMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleProfileSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Full Professional Name</label>
                        <input
                          type="text"
                          required
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Primary Contact Phone</label>
                        <input
                          type="text"
                          required
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Consulting Fees ($)</label>
                        <input
                          type="number"
                          required
                          value={editFees}
                          onChange={(e) => setEditFees(e.target.value)}
                          className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Medical Specialization</label>
                        <input
                          type="text"
                          required
                          value={editSpecialization}
                          onChange={(e) => setEditSpecialization(e.target.value)}
                          className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Hours Start</label>
                        <input
                          type="time"
                          required
                          value={editTimingsStart}
                          onChange={(e) => setEditTimingsStart(e.target.value)}
                          className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Hours End</label>
                        <input
                          type="time"
                          required
                          value={editTimingsEnd}
                          onChange={(e) => setEditTimingsEnd(e.target.value)}
                          className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Clinic Location Address</label>
                      <textarea
                        required
                        rows={2}
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      {profileSaving ? <span>Saving adjustments...</span> : <span>Save Settings</span>}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Patient Scheduling Alerts</h2>
                    <p className="text-sm text-slate-600">Track and respond immediately to patient booking requests.</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleMarkAllRead}
                      className="px-3.5 py-2 text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Mark All as Read
                    </button>
                    <button
                      onClick={handleDeleteAllNotifications}
                      className="px-3.5 py-2 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Clear History</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <div className="border-b border-slate-50 pb-4 mb-4">
                    <h3 className="font-bold text-slate-900 text-sm">Unread Alerts ({unreadCount})</h3>
                  </div>

                  {unreadCount === 0 ? (
                    <p className="text-slate-500 text-xs py-4 text-center">No new notifications.</p>
                  ) : (
                    <div className="space-y-3">
                      {user.notification?.map((not, idx) => (
                        <div key={idx} className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl flex items-start gap-3">
                          <div className="w-2 h-2 bg-emerald-600 rounded-full mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-slate-800 font-medium">{not.message}</p>
                            {not.date && (
                              <span className="text-[10px] text-slate-400 block mt-1">{new Date(not.date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-b border-slate-50 pb-4 mt-8 mb-4">
                    <h3 className="font-bold text-slate-900 text-sm">Read Alerts</h3>
                  </div>

                  {(!user.seennotification || user.seennotification.length === 0) ? (
                    <p className="text-slate-500 text-xs py-4 text-center">No history.</p>
                  ) : (
                    <div className="space-y-3">
                      {user.seennotification.map((not, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
                          <div className="w-2 h-2 bg-slate-400 rounded-full mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-slate-600 font-medium">{not.message}</p>
                            {not.date && (
                              <span className="text-[10px] text-slate-400 block mt-1">{new Date(not.date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Conclude Appointment notes modal */}
      {concludingApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 w-full max-w-lg relative text-left"
          >
            <button
              onClick={() => setConcludingApp(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-slate-950 text-xl mb-1">Conclude Appointment & Treat Patient</h3>
            <p className="text-xs text-slate-500">Provide medical recommendations and custom prescription notes for <strong className="text-slate-700">{concludingApp.userInfo?.fullName}</strong>.</p>

            <form onSubmit={handleConcludeSubmit} className="space-y-5 mt-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Prescriptions / Consultation Notes</label>
                <textarea
                  required
                  rows={5}
                  placeholder="e.g. Prescribed Amoxicillin 500mg - 3 times daily. Advised complete bed rest for 3 days. Return for review if symptoms persist..."
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConcludingApp(null)}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={notesSaving}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  {notesSaving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Conclude Appointment</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
