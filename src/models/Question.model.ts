import mongoose, { Schema } from "mongoose";

export const questionSchema = new Schema({
    question: String,
    options: [String],
    correct_answer: String,
    explanation: String,
    topic: String,
    subtopic: String,
    incorrect_explanations: [String],
    imageUrl: String,
    internationalization: {
        "es": {
            question: String,
            options: [String],
            correct_answer: String,
            explanation: String,
            topic: String,
            subtopic: String,
            incorrect_explanations: [String],
        }
    }
});

export const Question = mongoose.model("Question", questionSchema, "Questions");

