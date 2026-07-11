import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "../lib/api";
import { UserType, DoctorType, AppointmentType } from "../types";
import { 
  Search, Calendar, FileText, Bell, Sparkles, UserCheck, Trash2, 
  User, CheckCircle, Clock, XCircle, Stethoscope, ChevronRight, 
  MapPin, DollarSign, Briefcase, Award, ArrowUpRight, Upload, X, LogOut, FileCode
} from "lucide-react";

interface PatientDashboardProps {
  user: UserType;
  onLogout: () => void;
  onRefreshUser: () => Promise<void>;
}

type TabType = "doctors" | "appointments" | "documents" | "notifications" | "apply";

export default function PatientDashboard({ user, onLogout, onRefreshUser }: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("doctors");
  const [doctors, setDoctors] = useState<DoctorType[]>([]);
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  // Booking Modal
  const [bookingDoc, setBookingDoc] = useState<DoctorType | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Apply as Doctor Form State
  const [applyFullName, setApplyFullName] = useState(user.fullName || "");
  const [applyEmail, setApplyEmail] = useState(user.email || "");
  const [applyPhone, setApplyPhone] = useState(user.phone || "");
  const [applyAddress, setApplyAddress] = useState("");
  const [applySpecialization, setApplySpecialization] = useState("");
  const [applyExperience, setApplyExperience] = useState("");
  const [applyFees, setApplyFees] = useState("");
  const [applyTimingsStart, setApplyTimingsStart] = useState("09:00");
  const [applyTimingsEnd, setApplyTimingsEnd] = useState("17:00");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [existingApplication, setExistingApplication] = useState<DoctorType | null>(null);

  // Fetch initial data
  const loadDoctors = async () => {
    try {
      const res = await api.getApprovedDoctors();
      if (res.success) setDoctors(res.data);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const loadAppointments = async () => {
    try {
      const res = await api.getUserAppointments();
      if (res.success) setAppointments(res.data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await api.getUserDocuments();
      if (res.success) setDocuments(res.data);
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  };

  const checkExistingApplication = async () => {
    try {
      const res = await api.adminGetAllDoctors();
      if (res.success) {
        const myApp = res.data.find((d: any) => d.userId === user._id);
        if (myApp) setExistingApplication(myApp);
      }
    } catch (err) {
      console.error("Error checking app status:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadDoctors(), loadAppointments(), loadDocuments(), checkExistingApplication()]).finally(() => {
      setLoading(false);
    });
  }, [user]);

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

  // Booking handler
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoc || !bookingDate || !bookingTime) return;

    setBookingLoading(true);
    try {
      const formData = new FormData();
      formData.append("date", `${bookingDate} ${bookingTime}`);
      formData.append("userId", user._id);
      formData.append("doctorId", bookingDoc._id);
      formData.append("userInfo", JSON.stringify({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      }));
      formData.append("doctorInfo", JSON.stringify(bookingDoc));

      if (uploadedFile) {
        formData.append("image", uploadedFile);
      }

      const res = await api.bookAppointment(formData);
      if (res.success) {
        setBookingSuccess(true);
        loadAppointments();
        loadDocuments();
        setTimeout(() => {
          setBookingDoc(null);
          setBookingDate("");
          setBookingTime("");
          setUploadedFile(null);
          setBookingSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error("Error booking appointment:", err);
    } finally {
      setBookingLoading(false);
    }
  };

  // Doctor Application Submission
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyLoading(true);
    try {
      const doctorPayload = {
        fullName: applyFullName,
        email: applyEmail,
        phone: applyPhone,
        address: applyAddress,
        specialization: applySpecialization,
        experience: applyExperience,
        fees: Number(applyFees),
        timings: {
          start: applyTimingsStart,
          end: applyTimingsEnd,
        },
      };

      const res = await api.applyAsDoctor(doctorPayload, user._id);
      if (res.success) {
        setApplySuccess(true);
        checkExistingApplication();
        setTimeout(() => {
          setApplySuccess(false);
          setActiveTab("doctors");
        }, 2000);
      }
    } catch (err) {
      console.error("Error submitting application:", err);
    } finally {
      setApplyLoading(false);
    }
  };

  // Filters calculation
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = specialtyFilter === "" || doc.specialization === specialtyFilter;
    return matchesSearch && matchesSpecialty;
  });

  const uniqueSpecialties = Array.from(new Set(doctors.map((d) => d.specialization)));

  const unreadCount = user.notification?.length || 0;

  return (
    <div id="patient-dashboard" className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-left">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white leading-none">MedicareBook</h1>
            <span className="text-[11px] text-slate-500 font-medium">PATIENT PORTAL</span>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="p-4 mx-4 my-3 bg-slate-800/40 rounded-2xl flex items-center gap-3 border border-slate-800">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
            {user.fullName[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-white truncate leading-tight">{user.fullName}</h4>
            <p className="text-[11px] text-emerald-400 truncate mt-0.5 capitalize">{user.type}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          <button
            onClick={() => setActiveTab("doctors")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "doctors" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10" : "hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Search className="w-4.5 h-4.5" />
            <span>Browse Doctors</span>
          </button>

          <button
            onClick={() => setActiveTab("appointments")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "appointments" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10" : "hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4.5 h-4.5" />
              <span>Appointments</span>
            </div>
            {appointments.length > 0 && (
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                {appointments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("documents")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "documents" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10" : "hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <FileText className="w-4.5 h-4.5" />
            <span>My Documents</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "notifications" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10" : "hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4.5 h-4.5" />
              <span>Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("apply")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "apply" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10" : "hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
            <span>Apply as Doctor</span>
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
          >
            {/* Doctors Tab */}
            {activeTab === "doctors" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Browse & Schedule Care</h2>
                  <p className="text-sm text-slate-600">Select verified specialists and arrange face-to-face visits instantly.</p>
                </div>

                {/* Filter and Search controls */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
                  <div className="md:col-span-8 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search doctor by name, specialty, address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm transition-all"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <select
                      value={specialtyFilter}
                      onChange={(e) => setSpecialtyFilter(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm transition-all"
                    >
                      <option value="">All Specializations</option>
                      {uniqueSpecialties.map((spec) => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Grid list of Doctors */}
                {filteredDoctors.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
                    <p className="text-slate-500 text-sm">No medical practitioners found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDoctors.map((doc) => (
                      <div key={doc._id} className="bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-xl rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
                                {doc.fullName.split(" ").pop()?.[0] || doc.fullName[0]}
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-950 text-base leading-tight">Dr. {doc.fullName}</h3>
                                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                  {doc.specialization}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-50 pt-3.5 mb-5">
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <span>{doc.experience} Years Experience</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{doc.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <span>Available: {doc.timings?.start} - {doc.timings?.end}</span>
                            </div>
                            <div className="flex items-center gap-2 font-semibold text-slate-800">
                              <DollarSign className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <span>Consultation: ${doc.fees}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setBookingDoc(doc)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                        >
                          <span>Book Appointment</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === "appointments" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Your Appointment History</h2>
                  <p className="text-sm text-slate-600">Track current diagnostic reviews and prescriptive care records.</p>
                </div>

                {appointments.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
                    <p className="text-slate-500 text-sm">You do not have any appointments scheduled yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((app) => (
                      <div key={app._id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 rounded-xl">
                              <Calendar className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-950 text-base">Dr. {app.doctorInfo?.fullName || "Specialist"}</h3>
                              <p className="text-xs text-slate-500 mt-0.5">{app.doctorInfo?.specialization} • scheduled on <span className="font-semibold text-slate-700">{app.date}</span></p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {app.status === "pending" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Awaiting Review</span>
                              </span>
                            )}
                            {app.status === "approved" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Approved</span>
                              </span>
                            )}
                            {app.status === "rejected" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-800 text-xs font-semibold rounded-full">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Rejected</span>
                              </span>
                            )}
                            {app.status === "completed" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 text-xs font-semibold rounded-full">
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Completed</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Consultation Notes & Files */}
                        {(app.notes || app.document) && (
                          <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50/50 p-4 rounded-xl">
                            {app.notes && (
                              <div>
                                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-1">Prescription / Consultation Notes</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">{app.notes}</p>
                              </div>
                            )}
                            {app.document && (
                              <div>
                                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-1">Uploaded Record</h4>
                                <div className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-lg w-fit">
                                  <FileText className="w-4 h-4 text-emerald-600" />
                                  <span className="text-xs text-slate-700 font-medium truncate max-w-[180px]">{app.document.filename}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Your Medical Records</h2>
                  <p className="text-sm text-slate-600">A central history of all prior diagnostic documents uploaded upon scheduling.</p>
                </div>

                {documents.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
                    <p className="text-slate-500 text-sm">No medical records or files have been uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((doc, i) => (
                      <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 flex-shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{doc.document.filename}</h4>
                          <p className="text-xs text-slate-500 mt-1">Consultant: <span className="font-semibold text-slate-700">Dr. {doc.doctorName}</span></p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Uploaded on {doc.date.split(" ")[0]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">In-App Notifications</h2>
                    <p className="text-sm text-slate-600">Receive live alerts when your scheduling or listing requests are processed.</p>
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
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear History</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <div className="border-b border-slate-50 pb-4 mb-4">
                    <h3 className="font-bold text-slate-900 text-sm">Unread alerts ({unreadCount})</h3>
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
                    <h3 className="font-bold text-slate-900 text-sm">Read alerts</h3>
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

            {/* Apply as Doctor Tab */}
            {activeTab === "apply" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Apply as a Healthcare Provider</h2>
                  <p className="text-sm text-slate-600">Register your clinical credentials to schedule and treat patients on our platform.</p>
                </div>

                {existingApplication ? (
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm text-center max-w-xl mx-auto">
                    <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <Clock className="w-8 h-8" />
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-lg">Application Under Review</h3>
                    <p className="text-slate-600 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                      Your professional application is currently being evaluated by our medical administrators. You will receive an in-app alert immediately upon verification status updates.
                    </p>
                    <div className="mt-6 p-4 bg-slate-50 rounded-2xl text-left border border-slate-100 space-y-2 text-xs text-slate-600">
                      <p><strong>Professional Name:</strong> Dr. {existingApplication.fullName}</p>
                      <p><strong>Specialization:</strong> {existingApplication.specialization}</p>
                      <p><strong>Consulting Fees:</strong> ${existingApplication.fees}</p>
                      <p><strong>Current Status:</strong> <span className="font-bold text-amber-700 uppercase">{existingApplication.status}</span></p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm max-w-3xl">
                    {applySuccess && (
                      <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm flex items-center gap-2.5">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span>Application submitted successfully! Redirecting...</span>
                      </div>
                    )}

                    <form className="space-y-6 text-slate-800" onSubmit={handleApplySubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Full Professional Name</label>
                          <input
                            type="text"
                            required
                            value={applyFullName}
                            onChange={(e) => setApplyFullName(e.target.value)}
                            className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Contact Email Address</label>
                          <input
                            type="email"
                            required
                            value={applyEmail}
                            onChange={(e) => setApplyEmail(e.target.value)}
                            className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Office Phone Number</label>
                          <input
                            type="tel"
                            required
                            value={applyPhone}
                            onChange={(e) => setApplyPhone(e.target.value)}
                            className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Medical Specialization</label>
                          <select
                            required
                            value={applySpecialization}
                            onChange={(e) => setApplySpecialization(e.target.value)}
                            className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                          >
                            <option value="">Select Specialty</option>
                            <option value="Cardiologist">Cardiologist</option>
                            <option value="Pediatrician">Pediatrician</option>
                            <option value="General Physician">General Physician</option>
                            <option value="Gynecologist">Gynecologist</option>
                            <option value="Neurologist">Neurologist</option>
                            <option value="Dermatologist">Dermatologist</option>
                            <option value="Orthopedic">Orthopedic</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Years of Experience</label>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="e.g. 8"
                            value={applyExperience}
                            onChange={(e) => setApplyExperience(e.target.value)}
                            className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Consulting Fees ($)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="e.g. 150"
                            value={applyFees}
                            onChange={(e) => setApplyFees(e.target.value)}
                            className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Work Hour Start</label>
                          <input
                            type="time"
                            required
                            value={applyTimingsStart}
                            onChange={(e) => setApplyTimingsStart(e.target.value)}
                            className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Work Hour End</label>
                          <input
                            type="time"
                            required
                            value={applyTimingsEnd}
                            onChange={(e) => setApplyTimingsEnd(e.target.value)}
                            className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Clinic/Office Location Address</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Suite 402, Medical Center Plaza..."
                          value={applyAddress}
                          onChange={(e) => setApplyAddress(e.target.value)}
                          className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={applyLoading}
                        className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {applyLoading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span>Submit Professional Application</span>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Booking Modal Popup */}
      {bookingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 w-full max-w-lg relative text-left"
          >
            <button
              onClick={() => setBookingDoc(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-slate-950 text-xl mb-1">Schedule Visit</h3>
            <p className="text-xs text-slate-600">With <strong className="text-slate-900">Dr. {bookingDoc.fullName}</strong> • Consulting fees: ${bookingDoc.fees}</p>

            {bookingSuccess ? (
              <div className="py-8 text-center text-emerald-800">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm">Appointment Requested Successfully</h4>
                <p className="text-xs text-slate-500 mt-1">Review is underway. Dr. {bookingDoc.fullName} has been notified.</p>
              </div>
            ) : (
              <form onSubmit={handleBookSubmit} className="space-y-5 mt-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Preferred Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Preferred Time</label>
                    <input
                      type="time"
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
                    />
                  </div>
                </div>

                {/* File Upload zone */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Medical Record / Document upload (Optional)</label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-slate-50/20 transition-all relative">
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setUploadedFile(e.target.files[0]);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-700 block">Drag & Drop file or select manually</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">PDFs, JPEGs or medical records up to 10MB</span>
                  </div>

                  {uploadedFile && (
                    <div className="mt-3 flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="font-medium truncate max-w-[200px]">{uploadedFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedFile(null)}
                        className="text-slate-400 hover:text-red-500 p-0.5 rounded-full cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-600/50 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {bookingLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Request Booking</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
