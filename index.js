import express from "express";
import cors from "cors";
import dotenv from "dotenv/config";
import tuitionsRouter from "./routes/tuitions.js";
import usersRouter from "./routes/users.js";
import paymentsRouter from "./routes/payments.js";
import statsRouter from "./routes/stats.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({origin: process.env.CLIENT_URL?.split(",") || "*"}));
app.use(express.json());

app.get("/", (req, res) => res.send( "MentorLagbe server is running" ));
app.use(("/users", usersRouter));
app.use("/tuitions", tuitionsRouter);
app.use("/payments", paymentsRouter);
app.use("/stats", statsRouter);


//Rote not found
app.use((req, res) => res.status(404).send({ message: "Not found" }));

app.listen(port, () => 
    console.log(`server is running on port: ${port}`));


export default app;