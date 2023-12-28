import mongoose, { Schema } from "mongoose";

const userDataSchema = new Schema({
  userId: String,
  usedQuestions: [String],
  markedQuestions: [String],
  correctQuestions: [String],
  incorrectQuestions: [String],
});

export const UserData = mongoose.model("userData", userDataSchema, "userData");