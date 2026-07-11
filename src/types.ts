export interface NotificationType {
  type: string;
  message: string;
  onClickPath: string;
  date?: string;
}

export interface UserType {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  type: "user" | "admin";
  isdoctor?: boolean;
  notification?: NotificationType[];
  seennotification?: NotificationType[];
}

export interface DoctorType {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  specialization: string;
  experience: string;
  fees: number;
  status: "pending" | "approved" | "rejected";
  timings: {
    start: string;
    end: string;
  };
}

export interface AppointmentType {
  _id: string;
  userId: string;
  doctorId: string;
  userInfo: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  doctorInfo: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    specialization?: string;
    fees?: number;
  };
  date: string;
  document: {
    filename: string;
    path: string;
    mimetype: string;
  } | null;
  status: "pending" | "approved" | "rejected" | "completed";
  notes?: string;
  createdAt?: string;
}
