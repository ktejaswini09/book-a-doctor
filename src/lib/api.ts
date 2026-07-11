import { UserType, DoctorType, AppointmentType } from "../types";

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

export const api = {
  // Auth & Profile
  login: async (payload: any) => {
    const res = await fetch("/api/user/login", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  register: async (payload: any) => {
    const res = await fetch("/api/user/register", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  getCurrentUser: async () => {
    const res = await fetch("/api/user/getuserdata", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    return res.json();
  },

  // Doctors
  applyAsDoctor: async (doctorData: any, userId: string) => {
    const res = await fetch("/api/user/registerdoc", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ doctor: doctorData, userId }),
    });
    return res.json();
  },

  getApprovedDoctors: async () => {
    const res = await fetch("/api/user/getalldoctorsu", {
      method: "GET",
      headers: getHeaders(),
    });
    return res.json();
  },

  // Appointments
  bookAppointment: async (formData: FormData) => {
    const res = await fetch("/api/user/getappointment", {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    });
    return res.json();
  },

  getUserAppointments: async () => {
    const res = await fetch("/api/user/getuserappointments", {
      method: "GET",
      headers: getHeaders(),
    });
    return res.json();
  },

  getUserDocuments: async () => {
    const res = await fetch("/api/user/getdocsforuser", {
      method: "GET",
      headers: getHeaders(),
    });
    return res.json();
  },

  // Notifications
  markAllNotificationsRead: async (userId: string) => {
    const res = await fetch("/api/user/getallnotification", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  deleteAllNotifications: async (userId: string) => {
    const res = await fetch("/api/user/deleteallnotification", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  // Admin APIs
  adminGetAllUsers: async () => {
    const res = await fetch("/api/admin/getallusers", {
      method: "GET",
      headers: getHeaders(),
    });
    return res.json();
  },

  adminGetAllDoctors: async () => {
    const res = await fetch("/api/admin/getalldoctors", {
      method: "GET",
      headers: getHeaders(),
    });
    return res.json();
  },

  adminApproveDoctor: async (doctorId: string, userId: string) => {
    const res = await fetch("/api/admin/getapprove", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ doctorId, userid: userId, status: "approved" }),
    });
    return res.json();
  },

  adminRejectDoctor: async (doctorId: string, userId: string) => {
    const res = await fetch("/api/admin/getreject", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ doctorId, userid: userId, status: "rejected" }),
    });
    return res.json();
  },

  adminGetAllAppointments: async () => {
    const res = await fetch("/api/admin/getallAppointmentsAdmin", {
      method: "GET",
      headers: getHeaders(),
    });
    return res.json();
  },

  // Doctor APIs
  doctorUpdateProfile: async (doctorData: any) => {
    const res = await fetch("/api/doctor/updateprofile", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(doctorData),
    });
    return res.json();
  },

  doctorGetAppointments: async () => {
    const res = await fetch("/api/doctor/getdoctorappointments", {
      method: "GET",
      headers: getHeaders(),
    });
    return res.json();
  },

  doctorHandleAppointmentStatus: async (appointmentId: string, status: string, notes?: string) => {
    const res = await fetch("/api/doctor/handlestatus", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ appointmentId, status, notes }),
    });
    return res.json();
  },

  doctorDownloadDocumentUrl: (appointmentId: string) => {
    const token = localStorage.getItem("token") || "";
    return `/api/doctor/getdocumentdownload?appointId=${appointmentId}&authorization=Bearer ${token}`;
  },
};
