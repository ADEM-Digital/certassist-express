import { ObjectId } from "bson";
import mongoose, { Schema } from "mongoose";

export const subtopicSchema = new Schema({
    topicId: ObjectId,
    name: String
});

export const Subtopic = mongoose.model("subtopic", subtopicSchema, "subtopics");