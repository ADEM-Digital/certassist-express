import mongoose, { Schema } from "mongoose";

const userDataSchema = new Schema({
  userId: String,
  email: String,
  usedQuestions: [String],
  markedQuestions: [String],
  correctQuestions: [String],
  incorrectQuestions: [String],
  dashboardTutorial: Boolean,
  testsTutorial: Boolean,
  isTrial: Boolean
});

export const UserData = mongoose.model("userData", userDataSchema, "userData");