import { Router } from "express";
import { ObjectId } from "mongodb";
import { getCollection, COLLECTIONS } from "../config/db.js";
import { verifyToken, verifyAdmin } from "../middlewares/auth.js";
import { validateId } from "../middlewares/validateId.js"; // ✅ নতুন

const router = Router();

// 
router.param("id", validateId);

const ROLES = ["student", "tutor", "admin"];

// Admin: সব ইউজার
router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  const users = await getCollection(COLLECTIONS.USERS);
  const result = await users.find({}).sort({ createdAt: -1 }).toArray();
  res.send(result);
});

// নিজের প্রোফাইল
router.get("/me", verifyToken, async (req, res) => {
  const users = await getCollection(COLLECTIONS.USERS);
  const user = await users.findOne({ email: req.user.email });
  res.send(user);
});

// নিজের প্রোফাইল আপডেট (name, phone, bio, image)
router.patch("/me", verifyToken, async (req, res) => {
  const { name, phone, bio, image } = req.body;
  const updates = {};
  if (name?.trim()) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone;
  if (bio !== undefined) updates.bio = bio;
  if (image) updates.image = image;

  const users = await getCollection(COLLECTIONS.USERS);
  const result = await users.updateOne(
    { email: req.user.email },
    { $set: updates }
  );
  res.send(result);
});

// Admin: রোল পরিবর্তন
router.patch("/:id/role", verifyToken, verifyAdmin, async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) {
    return res.status(400).send({ message: "Invalid role" });
  }

  // ✅ নতুন: অ্যাডমিন নিজের রোল নিজে বদলাতে পারবে না
  // (এটা রুটের ভেতরে থাকতে হবে, আগে ফাইলের বাইরে ছিল বলে ক্র্যাশ করত)
  if (req.params.id === req.user.id) {
    return res.status(400).send({ message: "You cannot change your own role" });
  }

  const users = await getCollection(COLLECTIONS.USERS);
  const result = await users.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { role } }
  );
  res.send(result);
});

export default router;