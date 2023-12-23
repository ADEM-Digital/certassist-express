import mongoose, { Schema } from "mongoose";

const questionSchema = new Schema({
    question: String,
    options: [String],
    correct_answer: String,
    explanation: String,
    topic: String,
    subtopic: String
});

export const Question = mongoose.model("Question", questionSchema, "Questions");

