import { ObjectId } from "bson";
import mongoose, { Schema } from "mongoose";

export const topicSchema = new Schema({
    name: String
});

export const Topic = mongoose.model("topic", topicSchema, "topics");