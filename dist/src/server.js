"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const Question_model_1 = require("./models/Question.model");
const mongodb_1 = require("../database/mongodb");
const UserData_model_1 = require("./models/UserData.model");
const cors_1 = __importDefault(require("cors"));
const Test_model_1 = require("./models/Test.model");
dotenv_1.default.config();
mongodb_1.database;
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.static("public"));
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.get("/", (req, res) => {
    res.send("Express + TypeScript Server");
});
// Questions routes
app.get("/questions", (req, res, next) => {
    Question_model_1.Question.find({})
        .then((questions) => res.status(200).json(questions))
        .catch((error) => {
        console.error("Error while retrieving the question", error);
        res.status(500).send({ error: "Failed to retrieve the questions." });
    });
});
app.post("/questions/ids", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield UserData_model_1.UserData.findOne({ userId: req.query.userId });
    let filter = {};
    if (req.body.selectedDifficulties) {
        filter["difficulty_level"] = { $in: req.body.selectedDifficulties };
    }
    if (req.body.selectedQuestionStatus !== "all") {
        if (req.body.selectedQuestionStatus === "used") {
            filter["_id"] = { $in: userData === null || userData === void 0 ? void 0 : userData.usedQuestions };
        }
        else if (req.body.selectedQuestionStatus === "unused") {
            filter["_id"] = { $nin: userData === null || userData === void 0 ? void 0 : userData.usedQuestions };
        }
    }
    Question_model_1.Question.aggregate([
        { $match: filter },
        { $sample: { size: req.body.questionCount } },
        { $project: { _id: 1 } },
    ])
        .then((questions) => res.status(200).json(questions.map((question) => question._id)))
        .catch((error) => {
        console.error("Error while retrieving the question", error);
        res.status(500).send({ error: "Failed to retrieve the questions." });
    });
}));
app.get("/availablequestions", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.query);
    const userData = yield UserData_model_1.UserData.find({ userId: req.query.userId });
    let filter = {};
    if (req.query.selectedDifficulties) {
        let difficulties = req.query.selectedDifficulties;
        filter["difficulty_level"] = {
            $in: difficulties.map((difficulty) => difficulty.value),
        };
    }
    if (req.query.selectedQuestionStatus &&
        req.query.selectedQuestionStatus !== "all") {
        if (req.query.selectedQuestionStatus === "unused") {
            filter["_id"] = {
                $nin: userData.map((users) => users.usedQuestions).flat(),
            };
        }
        else if (req.query.selectedQuestionStatus === "used") {
            filter["_id"] = {
                $in: userData.map((users) => users.usedQuestions).flat(),
            };
        }
    }
    Question_model_1.Question.find(Object.assign({}, filter))
        .select("_id difficulty_level topic subtopic")
        .then((questions) => res.status(200).json(questions))
        .catch((error) => {
        console.error("Error while retrieving the questions", error);
        res.status(500).send({ error: "Failed to retrieve the questions." });
    });
}));
app.post("/availableQuestionOptions", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let topicsQuery = [];
    let subtopicsQuery = [];
    if (req.body.availableTopics) {
        topicsQuery = yield Question_model_1.Question.aggregate([
            {
                $match: {
                    topic: { $in: req.body.availableTopics },
                    difficulty_level: {
                        $in: req.body.selectedDifficulties.map((diff) => diff.value),
                    },
                },
            },
            {
                $project: {
                    topic: 1, // Only include the 'topic' field
                },
            },
            {
                $group: {
                    _id: "$topic",
                    topic: { $first: "$topic" },
                    totalQuestions: { $count: {} },
                },
            },
            {
                $sort: { totalQuestions: -1 },
            },
        ]);
        topicsQuery = topicsQuery.map((topic) => ({
            _id: topic._id,
            name: topic._id,
            totalQuestions: topic.totalQuestions,
        }));
        console.log(topicsQuery);
    }
    if (req.body.availableSubtopics) {
        subtopicsQuery = yield Question_model_1.Question.aggregate([
            {
                $match: {
                    subtopic: { $in: req.body.availableSubtopics },
                    difficulty_level: {
                        $in: req.body.selectedDifficulties.map((diff) => diff.value),
                    },
                },
            },
            {
                $project: {
                    subtopic: 1,
                    topic: 1,
                },
            },
            {
                $group: {
                    _id: "$subtopic",
                    topic: { $first: "$topic" },
                    subtopic: { $first: "$subtopic" },
                    totalQuestions: { $count: {} },
                },
            },
            {
                $sort: { totalQuestions: -1 },
            },
        ]);
        subtopicsQuery = subtopicsQuery.map((subtopic) => ({
            _id: subtopic._id,
            topic: subtopic.topic,
            name: subtopic._id,
            totalQuestions: subtopic.totalQuestions,
        }));
        console.log(subtopicsQuery);
    }
    return res.status(200).json({ topicsQuery, subtopicsQuery });
}));
app.get("/questions/:id", (req, res, next) => {
    let { id } = req.params;
    Question_model_1.Question.findOne({
        _id: id,
    })
        .then((question) => {
        let questionObject = {};
        if (req.query.testStatus !== "completed") {
            questionObject = {
                _id: question === null || question === void 0 ? void 0 : question._id,
                question: question === null || question === void 0 ? void 0 : question.question,
                options: question === null || question === void 0 ? void 0 : question.options,
            };
        }
        else {
            return res.status(200).json(question);
        }
        return res.status(200).json(questionObject);
    })
        .catch((error) => {
        console.error("Error while retrieving question", error);
        return res.status(500).json("Error while retrieving question.");
    });
});
// User Routes
app.get("/usersData", (req, res, next) => {
    console.log(req.query.userId);
    console.log("Ran query");
    UserData_model_1.UserData.find({ userId: req.query.userId })
        .then((userData) => res.status(200).json(userData))
        .catch((error) => {
        console.error("Error while retrieving the user data", error);
        res.status(500).send({ error: "Failed to retrieve the user data." });
    });
});
app.post("/usersData", (req, res, next) => {
    console.log(req.body);
    UserData_model_1.UserData.create(Object.assign({}, req.body))
        .then((userData) => {
        console.log(`Created the user data`, userData);
        res.status(200).json(userData);
    })
        .catch((error) => {
        console.error("Error while creating the user data", error);
        res.status(500).send({ error: "Failed to create the user data." });
    });
});
app.put("/usersData", (req, res, next) => {
    console.log(req.body);
    UserData_model_1.UserData.updateOne({ _id: req.body.userDataId }, { $set: req.body.usedQuestions })
        .then((result) => res.status(200).json(result))
        .catch((error) => {
        console.error("Failed to update the user data", error);
        res.status(500).send({ error: "Failed to update the user data." });
    });
});
// Tests routes
app.get("/tests", (req, res, next) => {
    console.log(req.query.userId);
    Test_model_1.Test.find({
        userId: req.query.userId,
    })
        .then((tests) => res.status(200).json(tests))
        .catch((error) => {
        console.error("Error while retrieving the tests", error);
        res.status(500).send({ error: "Failed to retrieve the tests." });
    });
});
app.post("/tests", (req, res, next) => {
    console.log(req.body);
    Test_model_1.Test.create(Object.assign({}, req.body))
        .then((test) => res.status(200).json(test))
        .catch((error) => {
        console.error("Error while creating the test", error);
        res.status(500).send({ error: "Failed to create the test." });
    });
});
app.delete("/tests", (req, res, next) => {
    console.log(req.query);
    Test_model_1.Test.deleteOne({ _id: req.query.testId })
        .then((result) => res.status(200).json(result))
        .catch((error) => {
        console.error("Error deleting the test", error);
        res.status(500).json("Error while deleting the test.");
    });
});
app.get("/tests/:id", (req, res, next) => {
    const { id } = req.params;
    Test_model_1.Test.findOne({ _id: id })
        .then((test) => res.status(200).json(test))
        .catch((error) => {
        console.error("Couldn't find a test", error);
        res.status(500).json("Couldn't find a test");
    });
});
app.put("/tests/:id", (req, res, next) => {
    const { id } = req.params;
    let updateParams = req.body;
    console.log(updateParams);
    Test_model_1.Test.updateOne({ _id: id }, {
        $set: updateParams,
    })
        .then((test) => res.status(200).json(test))
        .catch((error) => {
        console.error("Error updating the test", error);
        res.status(500).json("Error updating the test.");
    });
});
app.put("/gradetests/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let { id } = req.params;
    let test = req.body;
    test.testStatus = "completed";
    console.log(test);
    let questionsIds = test.questions.map((question) => question.id);
    let sourceQuestions = [];
    try {
        sourceQuestions = yield Question_model_1.Question.find({ _id: { $in: questionsIds } });
    }
    catch (error) {
        console.log("Error retrieving source questions", error);
        return res.status(500).json("Error updating the test.");
    }
    console.log(sourceQuestions.length);
    test.questions.forEach((question, index) => {
        let questionData = sourceQuestions.find((sourceQuestion) => {
            return question.id === sourceQuestion._id.toString();
        });
        if (questionData === null || questionData === void 0 ? void 0 : questionData._id) {
            console.log("ran correct update");
            test.questions[index].correct =
                questionData.correct_answer === question.answer ? 1 : 0;
        }
    });
    test.grade =
        (test.questions.reduce((acc, currVal) => currVal.correct === null ? acc + 0 : acc + currVal.correct, 0) /
            test.questionCount) *
            100;
    try {
        let updateResponse = yield Test_model_1.Test.updateOne({ _id: id }, test);
        return res.status(200).jsonp(updateResponse);
    }
    catch (error) {
        console.error("Error while updating the test grade.", error);
        return res.status(500).json("Couldn't update the test grade.");
    }
}));
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
module.exports = app;
