import express, { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { UserDB, DoctorDB, AppointmentDB, UserType } from "../db";
import authMiddleware, { AuthenticatedRequest, JWT_SECRET } from "../authMiddleware";

const router = express.Router();

// Ensure uploads folder exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// POST: /api/user/register
router.post("/register", async (req, res: Response): Promise<any> => {
  try {
    const { fullName, email, password, phone, type } = req.body;
    
    // Check if user already exists
    const existsUser = await UserDB.findOne({ email });
    if (existsUser) {
      return res.status(200).json({
        message: "User already exists",
        success: false,
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user
    const newUser = await UserDB.create({
      fullName: fullName || "User",
      email,
      password: hashedPassword,
      phone: phone || "",
      type: type || "user",
      isdoctor: false,
      notification: [],
      seennotification: [],
    });

    return res.status(201).json({
      message: "Register Success",
      success: true,
      data: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        type: newUser.type,
      }
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

// POST: /api/user/login
router.post("/login", async (req, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await UserDB.findOne({ email });
    if (!user) {
      return res.status(200).json({
        message: "User not found",
        success: false,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(200).json({
        message: "Invalid email or password",
        success: false,
      });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    // Strip password from returned user data
    const userData = { ...user };
    delete userData.password;

    return res.status(200).json({
      message: "Login successfully",
      success: true,
      token,
      userData,
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

// POST: /api/user/getuserdata (GET user data using token)
router.post("/getuserdata", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const user = await UserDB.findById(req.body.userId!);
    if (!user) {
      return res.status(200).json({
        message: "User not found",
        success: false,
      });
    }
    
    const userData = { ...user };
    delete userData.password;

    return res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Get User Data Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// POST: /api/user/registerdoc (Apply as a doctor)
router.post("/registerdoc", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { doctor, userId } = req.body;
    
    // Check if there is already an application for this user
    const existingDoc = await DoctorDB.findOne({ userId });
    if (existingDoc) {
      // Update existing application
      const updatedDoc = await DoctorDB.findByIdAndUpdate(existingDoc._id, {
        ...doctor,
        status: "pending", // Reset status to pending for review
      });
      return res.status(200).json({
        success: true,
        message: "Doctor Application Updated and Resubmitted Successfully",
        data: updatedDoc,
      });
    }

    // Create a new doctor record
    const newDoc = await DoctorDB.create({
      userId,
      fullName: doctor.fullName,
      email: doctor.email,
      phone: doctor.phone,
      address: doctor.address,
      specialization: doctor.specialization,
      experience: doctor.experience,
      fees: Number(doctor.fees) || 0,
      status: "pending",
      timings: doctor.timings,
    });

    return res.status(201).json({
      success: true,
      message: "Doctor account applied successfully",
      data: newDoc,
    });
  } catch (error: any) {
    console.error("Register Doctor Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

// GET: /api/user/getalldoctorsu (Get approved doctors list for patients)
router.get("/getalldoctorsu", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const approvedDoctors = await DoctorDB.find({ status: "approved" });
    return res.status(200).json({
      success: true,
      data: approvedDoctors,
    });
  } catch (error) {
    console.error("Get Approved Doctors Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// POST: /api/user/getappointment (Book an appointment with document upload)
// Uses multer key "image" as specified in `DoctorList.jsx` formData.append('image', documentFile)
router.post("/getappointment", upload.single("image"), authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { date, userId, doctorId, userInfo, doctorInfo } = req.body;

    // Parse metadata
    const parsedUserInfo = typeof userInfo === "string" ? JSON.parse(userInfo) : userInfo;
    const parsedDoctorInfo = typeof doctorInfo === "string" ? JSON.parse(doctorInfo) : doctorInfo;

    // Build document metadata if uploaded
    let documentFile = null;
    if (req.file) {
      documentFile = {
        filename: req.file.filename,
        path: `uploads/${req.file.filename}`, // Relative path for retrieval
        mimetype: req.file.mimetype,
      };
    }

    // Create appointment
    const newAppointment = await AppointmentDB.create({
      userId,
      doctorId,
      userInfo: parsedUserInfo,
      doctorInfo: parsedDoctorInfo,
      date,
      document: documentFile,
      status: "pending",
      notes: "",
    });

    // Notify doctor of new booking request
    const doctorUser = await UserDB.findById(parsedDoctorInfo.userId || "");
    if (doctorUser) {
      const notification = doctorUser.notification || [];
      notification.push({
        type: "new-appointment-request",
        message: `New appointment request from ${parsedUserInfo.fullName || parsedUserInfo.name} on ${date}`,
        onClickPath: "/doctor-appointments",
        date: new Date().toISOString(),
      });
      await UserDB.findByIdAndUpdate(doctorUser._id, { notification });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment Booked Successfully",
      data: newAppointment,
    });
  } catch (error: any) {
    console.error("Book Appointment Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while booking appointment",
    });
  }
});

// POST: /api/user/getallnotification (Mark notifications as read)
router.post("/getallnotification", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.body;
    const user = await UserDB.findById(userId);
    if (!user) {
      return res.status(200).json({
        success: false,
        message: "User not found",
      });
    }

    const currentNotifications = user.notification || [];
    const currentSeenNotifications = user.seennotification || [];

    // Mark all as read: move notifications to seennotification
    const updatedSeen = [...currentSeenNotifications, ...currentNotifications];
    const updatedUser = await UserDB.findByIdAndUpdate(userId, {
      notification: [],
      seennotification: updatedSeen,
    });

    if (updatedUser) {
      const responseUser = { ...updatedUser, notification: [], seennotification: updatedSeen };
      delete responseUser.password;
      return res.status(200).json({
        success: true,
        message: "All notifications marked as read",
        data: responseUser,
      });
    }

    return res.status(200).json({
      success: false,
      message: "Unable to update notifications",
    });
  } catch (error) {
    console.error("Mark Read Notification Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

// POST: /api/user/deleteallnotification (Clear read notifications)
router.post("/deleteallnotification", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.body;
    const user = await UserDB.findById(userId);
    if (!user) {
      return res.status(200).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete read notifications (clear seennotification)
    const updatedUser = await UserDB.findByIdAndUpdate(userId, {
      seennotification: [],
    });

    if (updatedUser) {
      const responseUser = { ...updatedUser, seennotification: [] };
      delete responseUser.password;
      return res.status(200).json({
        success: true,
        message: "Notifications deleted successfully",
        data: responseUser,
      });
    }

    return res.status(200).json({
      success: false,
      message: "Unable to clear notifications",
    });
  } catch (error) {
    console.error("Delete Notification Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

// GET: /api/user/getuserappointments (Get list of appointments for patient)
router.get("/getuserappointments", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.body.userId;
    // Find all appointments matching this userId
    const appointments = await AppointmentDB.find({ userId });
    return res.status(200).json({
      success: true,
      message: "All the appointments are listed below.",
      data: appointments,
    });
  } catch (error) {
    console.error("Get User Appointments Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

// GET: /api/user/getdocsforuser (Get all documents for user)
router.get("/getdocsforuser", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.body.userId;
    const appointments = await AppointmentDB.find({ userId });
    const docs = appointments
      .filter((app) => app.document !== null)
      .map((app) => ({
        appointmentId: app._id,
        doctorName: app.doctorInfo.fullName || "Doctor",
        date: app.date,
        document: app.document,
      }));

    return res.status(200).json({
      success: true,
      message: "Documents fetched successfully",
      data: docs,
    });
  } catch (error) {
    console.error("Get Docs for User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
