import mongoose, { Schema } from "mongoose";
import { questionSchema } from "./Question.model";

const difficultySchema = new Schema({
  value: String,
  label: String,
});

const TestQuestionsSchema = new Schema({
  id: String,
  answer: {
    type: String,
    default: null
  },  
  correct: {
    type: Number,
    default: null
  },
  marked: {
    type: Boolean,
    default: null
  }

})
const testSchema = new Schema({
  selectedDifficulties: [difficultySchema],
  selectedQuestionStatus: String,
  selectedAnswerStatus: String,
  selectedMarkStatus: String,
  selectedTopics: [String],
  selectedSubtopics: [String],
  testMode: String,
  questionCount: Number,
  testName: String,
  questions: [TestQuestionsSchema],
  createdAt: Date,
  updatedAt: Date,
  testStatus: String,
  testTime: Number,
  userId: String,
  startedAt: Number,
  grade: Number
});

export const Test = mongoose.model("test", testSchema, "tests");
