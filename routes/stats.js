import { Router } from "express";
import { getCollection, COLLECTIONS } from "../config/db.js";
import {
  verifyToken,
  verifyStudent,
  verifyTutor,
  verifyAdmin,
} from "../middlewares/auth.js";

const router = Router();

// ---------- Public: হোম পেজের কাউন্টার ----------
router.get("/public", async (req, res) => {
  const users = await getCollection(COLLECTIONS.USERS);
  const tuitions = await getCollection(COLLECTIONS.TUITIONS);
  const [tutors, students, activeTuitions] = await Promise.all([
    users.countDocuments({ role: "tutor" }),
    users.countDocuments({ role: "student" }),
    tuitions.countDocuments({ approvalStatus: "approved", isActive: true }),
  ]);
  res.send({ tutors, students, activeTuitions });
});

// ---------- Student ----------
router.get("/student", verifyToken, verifyStudent, async (req, res) => {
  const applications = await getCollection(COLLECTIONS.APPLICATIONS);
  const mine = { studentEmail: req.user.email };
  const [totalApplied, accepted, pending] = await Promise.all([
    applications.countDocuments(mine),
    applications.countDocuments({ ...mine, status: "accepted" }),
    applications.countDocuments({ ...mine, status: "pending" }),
  ]);
  res.send({ totalApplied, accepted, pending, plan: req.user.plan });
});

// ---------- Tutor ----------
router.get("/tutor", verifyToken, verifyTutor, async (req, res) => {
  const tuitions = await getCollection(COLLECTIONS.TUITIONS);
  const applications = await getCollection(COLLECTIONS.APPLICATIONS);
  const mine = { tutorEmail: req.user.email };
  const [totalTuitions, activeApproved, totalApplicants] = await Promise.all([
    tuitions.countDocuments(mine),
    tuitions.countDocuments({ ...mine, approvalStatus: "approved", isActive: true }),
    applications.countDocuments(mine),
  ]);
  res.send({ totalTuitions, activeApproved, totalApplicants, plan: req.user.plan });
});

// ---------- Admin ----------
router.get("/admin", verifyToken, verifyAdmin, async (req, res) => {
  const users = await getCollection(COLLECTIONS.USERS);
  const tuitions = await getCollection(COLLECTIONS.TUITIONS);
  const payments = await getCollection(COLLECTIONS.PAYMENTS);

  const [totalUsers, totalTutors, pendingTuitions, approvedTuitions, revenueAgg] =
    await Promise.all([
      users.countDocuments({}),
      users.countDocuments({ role: "tutor" }),
      tuitions.countDocuments({ approvalStatus: "pending" }),
      tuitions.countDocuments({ approvalStatus: "approved" }),
      payments.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]).toArray(),
    ]);

  res.send({
    totalUsers,
    totalTutors,
    pendingTuitions,
    approvedTuitions,
    totalRevenue: revenueAgg[0]?.total || 0,
  });
});

export default router;