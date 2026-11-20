import express from "express";
import cors from "cors";
import dotenv from "dotenv/config";



const app = express();
const port = process.env.PORT || 5000;

app.use(cors({origin: process.env.CLIENT_URL?.split(",") || "*"}));
app.use(express.json());

app.get("/", (req, res) => res.send( "MentorLagbe server is running" ));
app.use(("/users", usersRouter));


//Rote not found
app.use((req, res) => res.status(404).send({ message: "Not found" }));

app.listen(port, () => 
    console.log(`server is running on port: ${port}`));


export default app;

// app.listen(port, () => {
//   console.log(`MentorLagbe server is running on port: ${port}`);
// });