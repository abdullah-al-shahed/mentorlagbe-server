import express from "express";
import cors from "cors";
import dotenv from "dotenv/config";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from MentorLagbe server");
});

app.listen(port, () => {
  console.log(`MentorLagbe server is running on port: ${port}`);
});