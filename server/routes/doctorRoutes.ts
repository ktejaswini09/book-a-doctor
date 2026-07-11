import express, { Response } from "express";
import path from "path";
import fs from "fs";
import { UserDB, DoctorDB, AppointmentDB } from "../db";
import authMiddleware, { AuthenticatedRequest } from "../authMiddleware";

const router = express.Router();

// POST: /api/doctor/updateprofile (Update doctor professional details)
router.post("/updateprofile", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.body;
    
    // Find doctor by userId
    const doctor = await DoctorDB.findOne({ userId });
    if (!doctor) {
      return res.status(200).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // Update details
    const updatedDoctor = await DoctorDB.findByIdAndUpdate(doctor._id, {
      ...req.body,
    });

    return res.status(200).json({
      success: true,
      message: "successfully updated profile",
      data: updatedDoctor,
    });
  } catch (error) {
    console.error("Update Doctor Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "something went wrong",
    });
  }
});

// GET: /api/doctor/getdoctorappointments (Get appointments assigned to this doctor)
router.get("/getdoctorappointments", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.body.userId;
    
    // Find doctor by userId
    const doctor = await DoctorDB.findOne({ userId });
    if (!doctor) {
      return res.status(200).json({
        success: false,
        message: "Doctor record not found",
      });
    }

    // Find all appointments with this doctorId
    const allAppointments = await AppointmentDB.find({ doctorId: doctor._id });
    
    return res.status(200).json({
      success: true,
      message: "All the appointments are listed below.",
      data: allAppointments,
    });
  } catch (error) {
    console.error("Get Doctor Appointments Error:", error);
    return res.status(500).json({
      success: false,
      message: "something went wrong",
    });
  }
});

// POST: /api/doctor/handlestatus (Approve / Reject / Complete appointment status)
router.post("/handlestatus", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { appointmentId, status, notes } = req.body;

    // 1. Update appointment
    const appointment = await AppointmentDB.findById(appointmentId);
    if (!appointment) {
      return res.status(200).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const updated = await AppointmentDB.findByIdAndUpdate(appointmentId, {
      status,
      notes: notes !== undefined ? notes : appointment.notes,
    });

    // 2. Notify the patient
    const patientUser = await UserDB.findById(appointment.userId);
    if (patientUser) {
      const notification = patientUser.notification || [];
      const doctorName = appointment.doctorInfo?.fullName || "Your Doctor";
      notification.push({
        type: "appointment-status-updated",
        message: `Your appointment with Dr. ${doctorName} has been ${status}${notes ? ". Notes: " + notes : ""}`,
        onClickPath: "/appointments",
        date: new Date().toISOString(),
      });
      await UserDB.findByIdAndUpdate(appointment.userId, { notification });
    }

    return res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error("Handle Appointment Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "something went wrong",
    });
  }
});

// GET: /api/doctor/getdocumentdownload (Download appointment document)
router.get("/getdocumentdownload", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const appointId = req.query.appointId as string;
    if (!appointId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required",
      });
    }

    const appointment = await AppointmentDB.findById(appointId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const documentUrl = appointment.document?.path;
    if (!documentUrl || typeof documentUrl !== "string") {
      return res.status(404).json({
        success: false,
        message: "Document URL is invalid",
      });
    }

    // Construct the absolute path
    const absoluteFilePath = path.join(process.cwd(), documentUrl);

    // Stream download if file exists
    if (fs.existsSync(absoluteFilePath)) {
      const filename = path.basename(absoluteFilePath);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", appointment.document?.mimetype || "application/octet-stream");
      
      const fileStream = fs.createReadStream(absoluteFilePath);
      fileStream.pipe(res);
      
      fileStream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Error reading the document",
          });
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }
  } catch (error) {
    console.error("Download Document Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

export default router;
