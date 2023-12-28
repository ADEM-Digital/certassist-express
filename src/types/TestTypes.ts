export type TestDataType = {
    _id: string;
    selectedDifficulties: Array<"easy" | "medium" | "hard">;
    selectedQuestionStatus: "all" | "used" | "unused";
    selectedAnswerStatus: "all" | "incorrect" | "correct";
    selectedMarkStatus: "all" | "marked" | "unmarked";
    selectedTopics: string[];
    selectedSubtopics: string[];
    testMode: "timed" | "tutor" | "untimed";
    questionCount: number;
    questions: {
      id: string;
      answer: string | null;
      correct: 0 | 1 | null;
      marked: boolean;
    }[];
    grade?: number;
    createdAt: string;
    updatedAt: string;
    testName?: string;
    testStatus: "pending" | "completed" | "in progress";
    startedAt: Date | null;
    testTime: number | null;
    remainingTime: number | null;
  };