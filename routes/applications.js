import { Router } from "express";
import { ObjectId } from "mongodb";
import { getCollection, COLLECTIONS } from "../config/db.js";
import {
  verifyToken,
  verifyStudent,
  verifyTutor,
} from "../middlewares/auth.js";

const router = Router();

// ---------- Student: apply ----------
router.post("/", verifyToken, verifyStudent, async (req, res) => {
  const { tuitionId, studentPhone, preferredSchedule, studentNote } = req.body;

  if (!ObjectId.isValid(tuitionId) || !studentPhone || !preferredSchedule) {
    return res.status(400).send({ message: "Missing required fields" });
  }

  const tuitions = await getCollection(COLLECTIONS.TUITIONS);
  const tuition = await tuitions.findOne({
    _id: new ObjectId(tuitionId),
    approvalStatus: "approved",
    isActive: true,
  });
  if (!tuition) {
    return res.status(404).send({ message: "Tuition is not available" });
  }

  const applications = await getCollection(COLLECTIONS.APPLICATIONS);

  // একই student একই tuition এ দুইবার apply করতে পারবে না
  const existing = await applications.findOne({
    tuitionId,
    studentEmail: req.user.email,
  });
  if (existing) {
    return res
      .status(409)
      .send({ message: "You have already applied for this tuition" });
  }

  const application = {
    tuitionId,
    tuitionTitle: tuition.title,
    subject: tuition.subject,
    monthlyFee: tuition.monthlyFee,
    tutorName: tuition.tutorName,
    tutorEmail: tuition.tutorEmail,
    studentName: req.user.name,
    studentEmail: req.user.email,
    studentPhone,
    preferredSchedule,
    studentNote: studentNote || "",
    status: "pending",
    appliedAt: new Date().toISOString(),
  };

  const result = await applications.insertOne(application);
  res.send(result);
});

// ---------- Student: নিজের সব application ----------
router.get("/mine", verifyToken, verifyStudent, async (req, res) => {
  const applications = await getCollection(COLLECTIONS.APPLICATIONS);
  const result = await applications
    .find({ studentEmail: req.user.email })
    .sort({ appliedAt: -1 })
    .toArray();
  res.send(result);
});

// ---------- Student: এই tuition এ আগে apply করেছে কিনা ----------
router.get("/check/:tuitionId", verifyToken, verifyStudent, async (req, res) => {
  const applications = await getCollection(COLLECTIONS.APPLICATIONS);
  const existing = await applications.findOne({
    tuitionId: req.params.tuitionId,
    studentEmail: req.user.email,
  });
  res.send({ applied: !!existing });
});

// ---------- Student: pending থাকলে cancel ----------
router.delete("/:id", verifyToken, verifyStudent, async (req, res) => {
  const applications = await getCollection(COLLECTIONS.APPLICATIONS);
  const result = await applications.deleteOne({
    _id: new ObjectId(req.params.id),
    studentEmail: req.user.email,
    status: "pending", // accepted/rejected হয়ে গেলে ডিলিট হবে না
  });
  if (result.deletedCount === 0) {
    return res
      .status(400)
      .send({ message: "Only your pending applications can be cancelled" });
  }
  res.send(result);
});

// ---------- Tutor: নিজের tuition গুলোর সব applicant ----------
router.get("/tutor", verifyToken, verifyTutor, async (req, res) => {
  const applications = await getCollection(COLLECTIONS.APPLICATIONS);
  const result = await applications
    .find({ tutorEmail: req.user.email })
    .sort({ appliedAt: -1 })
    .toArray();
  res.send(result);
});

// ---------- Tutor: accept / reject ----------
router.patch("/:id/status", verifyToken, verifyTutor, async (req, res) => {
  const { status } = req.body;
  if (!["accepted", "rejected", "pending"].includes(status)) {
    return res.status(400).send({ message: "Invalid status" });
  }
  const applications = await getCollection(COLLECTIONS.APPLICATIONS);
  const result = await applications.updateOne(
    { _id: new ObjectId(req.params.id), tutorEmail: req.user.email },
    { $set: { status } }
  );
  res.send(result);
});

export default router;