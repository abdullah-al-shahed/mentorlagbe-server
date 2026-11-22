import { Router } from "express";
import { ObjectId } from "mongodb";
import { getCollection, COLLECTIONS } from "../config/db.js";
import {
  verifyToken,
  verifyTutor,
  verifyAdmin,
} from "../middlewares/auth.js";
import { validateId } from "../middlewares/validateId.js";

const router = Router();

router.param("id", validateId);

const FREE_TUITION_LIMIT = 2;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------- Public: approved + active tuitions (search, filter, pagination) ----------
router.get("/", async (req, res) => {
  const { search, subject, classLevel, mode } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 9, 1), 50);

  const query = { approvalStatus: "approved", isActive: true };

  if (search?.trim()) {
    const regex = { $regex: escapeRegex(search.trim()), $options: "i" };
    query.$or = [{ title: regex }, { subject: regex }];
  }
  if (subject) query.subject = subject;
  if (classLevel) query.classLevel = classLevel;
  if (mode) query.mode = mode;

  const tuitions = await getCollection(COLLECTIONS.TUITIONS);
  const total = await tuitions.countDocuments(query);
  const items = await tuitions
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  res.send({
    items,
    total,
    page,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  });
});

// ---------- Public: filter dropdown এর জন্য distinct মান ----------
router.get("/filters", async (req, res) => {
  const tuitions = await getCollection(COLLECTIONS.TUITIONS);
  const base = { approvalStatus: "approved", isActive: true };
  const [subjects, classLevels] = await Promise.all([
    tuitions.distinct("subject", base),
    tuitions.distinct("classLevel", base),
  ]);
  res.send({ subjects: subjects.sort(), classLevels: classLevels.sort() });
});

// ---------- Tutor: নিজের সব tuition ----------
router.get("/mine", verifyToken, verifyTutor, async (req, res) => {
  const tuitions = await getCollection(COLLECTIONS.TUITIONS);
  const result = await tuitions
    .find({ tutorEmail: req.user.email })
    .sort({ createdAt: -1 })
    .toArray();
  res.send(result);
});

// ---------- Admin: সব tuition ----------
router.get("/admin/all", verifyToken, verifyAdmin, async (req, res) => {
  const tuitions = await getCollection(COLLECTIONS.TUITIONS);
  const result = await tuitions.find({}).sort({ createdAt: -1 }).toArray();
  res.send(result);
});

// ---------- Public: একটা tuition এর ডিটেইলস + tutor সামারি ----------
router.get("/:id", async (req, res) => {
  const tuitions = await getCollection(COLLECTIONS.TUITIONS);

  
  const tuition = await tuitions.findOne({
    _id: new ObjectId(req.params.id),
    approvalStatus: "approved",
    isActive: true,
  });
  if (!tuition) return res.status(404).send({ message: "Tuition not found" });

  const users = await getCollection(COLLECTIONS.USERS);
  const tutor = await users.findOne(
    { email: tuition.tutorEmail },
    { projection: { name: 1, image: 1, bio: 1, plan: 1 } }
  );
  res.send({ ...tuition, tutor });
});

// ---------- Tutor: নতুন tuition পোস্ট ----------
router.post("/", verifyToken, verifyTutor, async (req, res) => {
  const tuitions = await getCollection(COLLECTIONS.TUITIONS);

  // Free plan এ সর্বোচ্চ ২টা
  if (req.user.plan !== "pro") {
    const count = await tuitions.countDocuments({
      tutorEmail: req.user.email,
    });
    if (count >= FREE_TUITION_LIMIT) {
      return res.status(403).send({
        message: "Free plan limit reached. Upgrade to Pro for unlimited posts.",
        code: "LIMIT_REACHED",
      });
    }
  }

  const {
    title, subject, classLevel, mode, location,
    monthlyFee, daysPerWeek, bannerImage, description,
  } = req.body;

  if (!title || !subject || !classLevel || !mode || !monthlyFee) {
    return res.status(400).send({ message: "Missing required fields" });
  }

  const tuition = {
    title: title.trim(),
    subject,
    classLevel,
    mode,
    location: location || "",
    monthlyFee: Number(monthlyFee),
    daysPerWeek: Number(daysPerWeek) || 3,
    bannerImage: bannerImage || "",
    description: description || "",
    tutorName: req.user.name,
    tutorEmail: req.user.email,
    approvalStatus: "pending",
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const result = await tuitions.insertOne(tuition);
  res.send(result);
});

// ---------- Tutor: নিজের tuition এডিট ----------
router.patch("/:id", verifyToken, verifyTutor, async (req, res) => {
  const allowed = [
    "title", "subject", "classLevel", "mode", "location",
    "monthlyFee", "daysPerWeek", "bannerImage", "description",
  ];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (updates.monthlyFee) updates.monthlyFee = Number(updates.monthlyFee);
  if (updates.daysPerWeek) updates.daysPerWeek = Number(updates.daysPerWeek);

  const tuitions = await getCollection(COLLECTIONS.TUITIONS);
  // tutorEmail মেলানো হচ্ছে, তাই অন্যের পোস্ট এডিট করা যাবে না
  const result = await tuitions.updateOne(
    { _id: new ObjectId(req.params.id), tutorEmail: req.user.email },
    { $set: updates }
  );
  res.send(result);
});

// ---------- Tutor: Active / Closed টগল ----------
router.patch("/:id/toggle", verifyToken, verifyTutor, async (req, res) => {
  const tuitions = await getCollection(COLLECTIONS.TUITIONS);
  const filter = { _id: new ObjectId(req.params.id), tutorEmail: req.user.email };
  const tuition = await tuitions.findOne(filter);
  if (!tuition) return res.status(404).send({ message: "Tuition not found" });

  const result = await tuitions.updateOne(filter, {
    $set: { isActive: !tuition.isActive },
  });
  res.send(result);
});

// ---------- Tutor: নিজের tuition ডিলিট ----------
router.delete("/:id", verifyToken, verifyTutor, async (req, res) => {
  const tuitions = await getCollection(COLLECTIONS.TUITIONS);
  const result = await tuitions.deleteOne({
    _id: new ObjectId(req.params.id),
    tutorEmail: req.user.email,
  });
  res.send(result);
});

// ---------- Admin: approve / reject ----------
router.patch("/:id/approval", verifyToken, verifyAdmin, async (req, res) => {
  const { approvalStatus } = req.body;
  if (!["approved", "rejected", "pending"].includes(approvalStatus)) {
    return res.status(400).send({ message: "Invalid approval status" });
  }
  const tuitions = await getCollection(COLLECTIONS.TUITIONS);
  const result = await tuitions.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { approvalStatus } }
  );
  res.send(result);
});

export default router;