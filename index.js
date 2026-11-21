import express from "express";
import cors from "cors";
import "dotenv/config";
import usersRouter from "./routes/users.js";
import tuitionsRouter from "./routes/tuitions.js";
import applicationsRouter from "./routes/applications.js";
import paymentsRouter from "./routes/payments.js";
import statsRouter from "./routes/stats.js";

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get("/", (req, res) => res.send("MentorLagbe server is running"));
app.use("/users", usersRouter);
app.use("/tuitions", tuitionsRouter);
app.use("/applications", applicationsRouter);
app.use("/payments", paymentsRouter);
app.use("/stats", statsRouter);

// অজানা রুট
app.use((req, res) => res.status(404).send({ message: "Route not found" }));

app.listen(port, () => console.log(`Server running on port ${port}`));

export default app;