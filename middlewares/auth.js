import jwt from "jsonwebtoken";
import { getCollection, COLLECTIONS } from "../config/db.js";

const unauthorized = (res) => res.status(401).send({ message: "Unauthorized" });
const forbidden = (res) => res.status(403).send({ message: "Forbidden" });

export const verifyToken = async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) return unauthorized(res);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // রোল টোকেন থেকে না নিয়ে DB থেকে নিচ্ছি, যাতে রোল বদলালে সাথে সাথে কার্যকর হয়
    const users = await getCollection(COLLECTIONS.USERS);
    const user = await users.findOne({ email: payload.email });
    if (!user) return unauthorized(res);

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan || "free",
    };
    next();
  } catch {
    return unauthorized(res);
  }
};

const allowRole = (role) => (req, res, next) =>
  req.user?.role === role ? next() : forbidden(res);

// verifyToken এর পরে ব্যবহার করতে হবে, যাতে req.user থাকে
export const verifyStudent = allowRole("student");
export const verifyTutor = allowRole("tutor");
export const verifyAdmin = allowRole("admin");