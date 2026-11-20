import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
let database = null;


export const getDb = async () => {
  if (!database) {
    await client.connect();
    database = client.db(process.env.DB_NAME || "mentorlagbe_db");
    console.log("MongoDB connected");
  }
  return database;
};

export const getCollection = async (name) => (await getDb()).collection(name);

export const COLLECTIONS = {
  USERS: "users",
  TUITIONS: "tuitions",
  APPLICATIONS: "applications",
  PAYMENTS: "payments",
};