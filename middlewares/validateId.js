import { ObjectId } from "mongodb";

export const validateId = (req, res, next, id) =>
  ObjectId.isValid(id) ? next() : res.status(400).send({ message: "Invalid id" });