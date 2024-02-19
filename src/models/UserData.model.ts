import mongoose, { Schema } from "mongoose";

const userDataSchema = new Schema({
  userId: String,
  usedQuestions: [String],
  markedQuestions: [String],
  correctQuestions: [String],
  incorrectQuestions: [String],
  dashboardTutorial: Boolean,
  testsTutorial: Boolean
});

export const UserData = mongoose.model("userData", userDataSchema, "userData");