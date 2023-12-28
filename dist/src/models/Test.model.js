"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Test = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const difficultySchema = new mongoose_1.Schema({
    value: String,
    label: String,
});
const TestQuestionsSchema = new mongoose_1.Schema({
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
});
const testSchema = new mongoose_1.Schema({
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
exports.Test = mongoose_1.default.model("test", testSchema, "tests");
