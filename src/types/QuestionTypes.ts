export type QuestionFilterType = {
  _id?: { $nin?: Array<string>; $in?: Array<string>;};
  difficulty_level?: { $in?: Array<"hard" | "medium" | "easy">;};
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