import mongoose from "mongoose";


export type QuestionFilterType = {
  _id?: { $nin?: Array<mongoose.Types.ObjectId>; $in?: Array<mongoose.Types.ObjectId>;};
  difficulty_level?: { $in?: Array<"hard" | "medium" | "easy">};
  topic?: {$in: string[]};
  subtopic?: {$in: string[]};
};

export type QuestionDataType = {
    _id: string;
    question: string;
    options: string[];
    correct_answer?: string;
    explanation?: string;
    topic?: string;
    subtopic?: string;
  };