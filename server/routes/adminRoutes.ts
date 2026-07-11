import express, { Response } from "express";
import { UserDB, DoctorDB, AppointmentDB } from "../db";
import authMiddleware, { AuthenticatedRequest } from "../authMiddleware";

const router = express.Router();

// GET: /api/admin/getallusers (Get all registered users)
router.get("/getallusers", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const users = await UserDB.find({});
    // Strip passwords before returning
    const safeUsers = users.map((u) => {
      const copy = { ...u };
      delete copy.password;
      return copy;
    });

    return res.status(200).json({
      message: "Users data list",
      success: true,
      data: safeUsers,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    return res.status(500).json({
      message: "something went wrong",
      success: false,
    });
  }
});

// GET: /api/admin/getalldoctors (Get all doctors applications)
router.get("/getalldoctors", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const doctors = await DoctorDB.find({});
    return res.status(200).json({
      message: "doctor Users data list",
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.error("Get All Doctors Error:", error);
    return res.status(500).json({
      message: "something went wrong",
      success: false,
    });
  }
});

// POST: /api/admin/getapprove (Approve doctor application)
router.post("/getapprove", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { doctorId, status, userid } = req.body;

    // 1. Update doctor status
    const doctor = await DoctorDB.findByIdAndUpdate(doctorId, { status: "approved" });
    if (!doctor) {
      return res.status(200).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // 2. Update user status (make them a doctor)
    const user = await UserDB.findById(userid);
    if (user) {
      const notification = user.notification || [];
      notification.push({
        type: "doctor-account-approved",
        message: `Your Doctor account has been ${status}`,
        onClickPath: "/notification",
        date: new Date().toISOString(),
      });

      await UserDB.findByIdAndUpdate(userid, {
        isdoctor: true,
        notification,
      });
    }

    return res.status(201).json({
      message: "Doctor approved successfully",
      success: true,
      data: { ...doctor, status: "approved" },
    });
  } catch (error) {
    console.error("Approve Doctor Error:", error);
    return res.status(500).json({
      message: "something went wrong",
      success: false,
    });
  }
});

// POST: /api/admin/getreject (Reject doctor application)
router.post("/getreject", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { doctorId, status, userid } = req.body;

    // 1. Update doctor status
    const doctor = await DoctorDB.findByIdAndUpdate(doctorId, { status: "rejected" });
    if (!doctor) {
      return res.status(200).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // 2. Add notification to user
    const user = await UserDB.findById(userid);
    if (user) {
      const notification = user.notification || [];
      notification.push({
        type: "doctor-account-approved",
        message: `Your Doctor account has been ${status}`,
        onClickPath: "/notification",
        date: new Date().toISOString(),
      });

      await UserDB.findByIdAndUpdate(userid, {
        isdoctor: false,
        notification,
      });
    }

    return res.status(201).json({
      message: "Successfully updated Rejected status of the doctor!",
      success: true,
      data: { ...doctor, status: "rejected" },
    });
  } catch (error) {
    console.error("Reject Doctor Error:", error);
    return res.status(500).json({
      message: "something went wrong",
      success: false,
    });
  }
});

// GET: /api/admin/getallAppointmentsAdmin (Get all appointments system-wide)
router.get("/getallAppointmentsAdmin", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const allAppointments = await AppointmentDB.find({});
    return res.status(200).json({
      success: true,
      message: "successfully fetched All Appointments",
      data: allAppointments,
    });
  } catch (error) {
    console.error("Get All Admin Appointments Error:", error);
    return res.status(500).json({
      message: "something went wrong",
      success: false,
    });
  }
});

export default router;
