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
const mongoose_1 = __importDefault(require("mongoose"));
const Billing_model_1 = require("./models/Billing.model");
const nodejs_1 = __importDefault(require("@emailjs/nodejs"));
const tickets_routes_1 = __importDefault(require("./routes/tickets.routes"));
dotenv_1.default.config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_API_KEY);
mongodb_1.database;
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.static("public"));
app.use(express_1.default.json());
const allowedOrigins = [
    "https://certassist-client.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://usmle1.certassist.app",
    "https://certassist-client-step2-ck.vercel.app",
    "https://usmle2.certassist.app",
];
const corsOptions = {
    // @ts-ignore
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
// @ts-ignore
app.use((0, cors_1.default)(corsOptions));
app.post("/dashboardData", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    try {
        let userData = yield UserData_model_1.UserData.findOne({ userId });
        let questionCount = yield Question_model_1.Question.countDocuments();
        let difficultyPerformanceResult = yield Test_model_1.Test.aggregate([
            {
                $match: {
                    userId: userId,
                    testStatus: "completed",
                },
            },
            {
                $unwind: "$questions",
            },
            {
                $lookup: {
                    from: "Questions",
                    let: { questionId: "$questions.id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", { $toObjectId: "$$questionId" }],
                                },
                            },
                        },
                    ],
                    as: "questionDetails",
                },
            },
            {
                $unwind: "$questionDetails",
            },
            {
                $group: {
                    _id: "$questionDetails.difficulty_level",
                    totalQuestions: { $sum: 1 },
                    correctAnswers: {
                        $sum: {
                            $cond: [{ $eq: ["$questions.correct", 1] }, 1, 0],
                        },
                    },
                },
            },
            {
                $project: {
                    difficulty: "$_id",
                    totalQuestions: 1,
                    correctAnswers: 1,
                    performance: {
                        $divide: ["$correctAnswers", "$totalQuestions"],
                    },
                },
            },
        ]);
        let topicPerformanceResult = yield Test_model_1.Test.aggregate([
            {
                $match: {
                    userId: userId,
                    testStatus: "completed",
                },
            },
            {
                $unwind: "$questions",
            },
            {
                $lookup: {
                    from: "Questions",
                    let: { questionId: "$questions.id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", { $toObjectId: "$$questionId" }],
                                },
                            },
                        },
                    ],
                    as: "questionDetails",
                },
            },
            {
                $unwind: "$questionDetails",
            },
            {
                $group: {
                    _id: "$questionDetails.topic",
                    totalQuestions: { $sum: 1 },
                    correctAnswers: {
                        $sum: {
                            $cond: [{ $eq: ["$questions.correct", 1] }, 1, 0],
                        },
                    },
                },
            },
            {
                $project: {
                    topic: "$_id",
                    totalQuestions: 1,
                    correctAnswers: 1,
                    performance: {
                        $divide: ["$correctAnswers", "$totalQuestions"],
                    },
                },
            },
        ]);
        let subtopicPerformanceResult = yield Test_model_1.Test.aggregate([
            {
                $match: {
                    userId: userId,
                    testStatus: "completed",
                },
            },
            {
                $unwind: "$questions",
            },
            {
                $lookup: {
                    from: "Questions",
                    let: { questionId: "$questions.id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", { $toObjectId: "$$questionId" }],
                                },
                            },
                        },
                    ],
                    as: "questionDetails",
                },
            },
            {
                $unwind: "$questionDetails",
            },
            {
                $group: {
                    _id: "$questionDetails.subtopic",
                    totalQuestions: { $sum: 1 },
                    correctAnswers: {
                        $sum: {
                            $cond: [{ $eq: ["$questions.correct", 1] }, 1, 0],
                        },
                    },
                },
            },
            {
                $project: {
                    subtopic: "$_id",
                    totalQuestions: 1,
                    correctAnswers: 1,
                    performance: {
                        $divide: ["$correctAnswers", "$totalQuestions"],
                    },
                },
            },
        ]);
        return res.status(200).json({
            userData,
            questionCount,
            difficultyPerformanceResult,
            topicPerformanceResult,
            subtopicPerformanceResult,
        });
    }
    catch (error) {
        console.error("Error while retrieving the dashboard data", error);
        return res.status(500).json("Error while retrieving the dashboard data");
    }
}));
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    console.log(req.body);
    const userData = yield UserData_model_1.UserData.findOne({ userId: req.body.userId });
    let filter = {};
    const { selectedQuestionStatus, selectedAnswerStatus, selectedMarkStatus, selectedDifficulties, selectedTopics, selectedSubtopics, } = req.body;
    if (selectedDifficulties) {
        let difficulties = selectedDifficulties;
        filter["difficulty_level"] = {
            $in: difficulties.findIndex((diff) => diff.value === "all") > -1
                ? ["easy", "medium", "hard"]
                : difficulties.map((difficulty) => difficulty.value),
        };
    }
    if (selectedQuestionStatus &&
        selectedQuestionStatus !== "all" &&
        userData &&
        (userData === null || userData === void 0 ? void 0 : userData.usedQuestions.length) > 0) {
        if (selectedQuestionStatus === "used") {
            filter["_id"] = {
                $in: userData === null || userData === void 0 ? void 0 : userData.usedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
            };
        }
        else if (req.body.selectedQuestionStatus === "unused") {
            filter["_id"] = {
                $nin: userData === null || userData === void 0 ? void 0 : userData.usedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
            };
        }
    }
    if (selectedAnswerStatus &&
        selectedAnswerStatus !== "all" &&
        userData &&
        (userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions.length) > 0) {
        if (selectedAnswerStatus === "incorrect") {
            if (filter["_id"]) {
                filter["_id"]["$in"] = ((_a = filter["_id"]) === null || _a === void 0 ? void 0 : _a.$in)
                    ? [
                        ...filter["_id"].$in,
                        ...userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    ]
                    : userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId));
            }
            else {
                filter["_id"] = {};
                filter["_id"]["$in"] = ((_b = filter["_id"]) === null || _b === void 0 ? void 0 : _b.$in)
                    ? [
                        ...filter["_id"].$in,
                        ...userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    ]
                    : userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId));
            }
        }
        else if (selectedAnswerStatus === "correct") {
            if (filter["_id"]) {
                filter["_id"]["$in"] = ((_c = filter["_id"]) === null || _c === void 0 ? void 0 : _c.$in)
                    ? [
                        ...filter["_id"].$in,
                        ...userData === null || userData === void 0 ? void 0 : userData.correctQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    ]
                    : userData === null || userData === void 0 ? void 0 : userData.correctQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId));
            }
            else {
                filter["_id"] = {};
                filter["_id"]["$in"] = ((_d = filter["_id"]) === null || _d === void 0 ? void 0 : _d.$in)
                    ? [
                        ...filter["_id"].$in,
                        ...userData === null || userData === void 0 ? void 0 : userData.correctQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    ]
                    : userData === null || userData === void 0 ? void 0 : userData.correctQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId));
            }
        }
    }
    if (selectedMarkStatus !== "all") {
        if (userData === null || userData === void 0 ? void 0 : userData.markedQuestions) {
            if (selectedMarkStatus === "marked") {
                filter["_id"] = {
                    $nin: ((_e = filter["_id"]) === null || _e === void 0 ? void 0 : _e.$nin) ? [...filter._id.$nin] : undefined,
                    $in: ((_f = filter["_id"]) === null || _f === void 0 ? void 0 : _f.$in)
                        ? [
                            ...filter["_id"].$in,
                            ...userData.markedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                        ]
                        : userData.markedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                };
            }
            else if (selectedMarkStatus === "unmarked") {
                filter["_id"] = {
                    $in: ((_g = filter["_id"]) === null || _g === void 0 ? void 0 : _g.$in) ? [...filter._id.$in] : undefined,
                    $nin: ((_h = filter["_id"]) === null || _h === void 0 ? void 0 : _h.$nin)
                        ? [
                            ...filter["_id"].$nin,
                            ...userData.markedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                        ]
                        : userData.markedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                };
            }
        }
    }
    if (!(selectedTopics.findIndex((topic) => topic === 0) > -1)) {
        filter["topic"] = { $in: selectedTopics };
    }
    if (!(selectedSubtopics.findIndex((subtopic) => subtopic === 0) > -1)) {
        filter["subtopic"] = { $in: selectedSubtopics };
    }
    // check if id filters are undefined
    if (((_j = filter._id) === null || _j === void 0 ? void 0 : _j.$in) === undefined) {
        (_k = filter._id) === null || _k === void 0 ? true : delete _k.$in;
    }
    if (((_l = filter._id) === null || _l === void 0 ? void 0 : _l.$nin) === undefined) {
        (_m = filter._id) === null || _m === void 0 ? true : delete _m.$nin;
    }
    console.log(filter);
    Question_model_1.Question.aggregate([
        { $match: filter },
        { $sample: { size: req.body.questionCount } },
        { $project: { _id: 1 } },
    ])
        .then((questions) => {
        console.log(questions);
        return res.status(200).json(questions.map((question) => question._id));
    })
        .catch((error) => {
        console.error("Error while retrieving the question", error);
        res.status(500).send({ error: "Failed to retrieve the questions." });
    });
}));
app.post("/availablequestions", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
    console.log(req.body);
    const userData = yield UserData_model_1.UserData.findOne({ userId: req.body.userId });
    let filter = {};
    const { selectedQuestionStatus, selectedAnswerStatus, selectedMarkStatus, selectedDifficulties, } = req.body;
    if (selectedDifficulties) {
        let difficulties = selectedDifficulties;
        filter["difficulty_level"] = {
            $in: difficulties.findIndex((diff) => diff.value === "all") > -1
                ? ["easy", "medium", "hard"]
                : difficulties.map((difficulty) => difficulty.value),
        };
    }
    if (selectedQuestionStatus &&
        selectedQuestionStatus !== "all" &&
        userData &&
        (userData === null || userData === void 0 ? void 0 : userData.usedQuestions.length) > 0) {
        if (selectedQuestionStatus === "used") {
            filter["_id"] = {
                $in: userData === null || userData === void 0 ? void 0 : userData.usedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
            };
        }
        else if (req.body.selectedQuestionStatus === "unused") {
            filter["_id"] = {
                $nin: userData === null || userData === void 0 ? void 0 : userData.usedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
            };
        }
    }
    if (selectedAnswerStatus &&
        selectedAnswerStatus !== "all" &&
        userData &&
        (userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions.length) > 0) {
        if (selectedAnswerStatus === "incorrect") {
            if (filter["_id"]) {
                filter["_id"]["$in"] = ((_o = filter["_id"]) === null || _o === void 0 ? void 0 : _o.$in)
                    ? [
                        ...userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    ]
                    : userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId));
            }
            else {
                filter["_id"] = {};
                filter["_id"]["$in"] = ((_p = filter["_id"]) === null || _p === void 0 ? void 0 : _p.$in)
                    ? [
                        ...userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    ]
                    : userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId));
            }
        }
        else if (selectedAnswerStatus === "correct") {
            if (filter["_id"]) {
                filter["_id"]["$in"] = ((_q = filter["_id"]) === null || _q === void 0 ? void 0 : _q.$in)
                    ? [
                        ...userData === null || userData === void 0 ? void 0 : userData.correctQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    ]
                    : userData === null || userData === void 0 ? void 0 : userData.correctQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId));
            }
            else {
                filter["_id"] = {};
                filter["_id"]["$in"] = ((_r = filter["_id"]) === null || _r === void 0 ? void 0 : _r.$in)
                    ? [
                        ...userData === null || userData === void 0 ? void 0 : userData.correctQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    ]
                    : userData === null || userData === void 0 ? void 0 : userData.correctQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId));
            }
        }
    }
    if (selectedMarkStatus !== "all") {
        if (userData === null || userData === void 0 ? void 0 : userData.markedQuestions) {
            if (selectedMarkStatus === "marked") {
                if (selectedAnswerStatus === "all") {
                    filter["_id"] = {
                        $nin: ((_s = filter["_id"]) === null || _s === void 0 ? void 0 : _s.$nin) ? [...filter._id.$nin] : undefined,
                        $in: ((_t = filter["_id"]) === null || _t === void 0 ? void 0 : _t.$in)
                            ? [
                                ...userData.markedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                            ]
                            : userData.markedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    };
                }
                else if ((_u = filter._id) === null || _u === void 0 ? void 0 : _u.$in) {
                    let filteredIds = filter._id.$in.filter((questionId) => userData.markedQuestions.includes(questionId.toString()));
                    filter._id.$in = filteredIds;
                }
            }
            else if (selectedMarkStatus === "unmarked") {
                if (selectedAnswerStatus === "all") {
                    filter["_id"] = {
                        $in: ((_v = filter["_id"]) === null || _v === void 0 ? void 0 : _v.$in) ? [...filter._id.$in] : undefined,
                        $nin: ((_w = filter["_id"]) === null || _w === void 0 ? void 0 : _w.$nin)
                            ? [
                                ...userData.markedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                            ]
                            : userData.markedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    };
                }
                else if ((_x = filter._id) === null || _x === void 0 ? void 0 : _x.$in) {
                    let filteredIds = filter._id.$in.filter((questionId) => userData.markedQuestions.includes(questionId.toString()));
                    filter._id.$nin = filteredIds;
                }
            }
        }
    }
    console.log(filter);
    Question_model_1.Question.find(Object.assign({}, filter))
        .select("_id difficulty_level topic subtopic")
        .then((questions) => res.status(200).json(questions))
        .catch((error) => {
        console.error("Error while retrieving the questions", error);
        res.status(500).send({ error: "Failed to retrieve the questions." });
    });
}));
app.post("/availableQuestionOptions", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11;
    let topicsQuery = [];
    let subtopicsQuery = [];
    const { selectedQuestionStatus, selectedAnswerStatus, selectedMarkStatus } = req.body;
    let userData = yield UserData_model_1.UserData.findOne({ userId: req.body.userId });
    let filter = {};
    if (req.body.selectedDifficulties) {
        let difficulties = req.body.selectedDifficulties;
        filter["difficulty_level"] = {
            $in: difficulties.findIndex((diff) => diff.value === "all") > -1
                ? ["easy", "medium", "hard"]
                : difficulties.map((difficulty) => difficulty.value),
        };
    }
    if (userData === null || userData === void 0 ? void 0 : userData.usedQuestions) {
        console.log(selectedQuestionStatus &&
            selectedQuestionStatus !== "all" &&
            (userData === null || userData === void 0 ? void 0 : userData.usedQuestions.length));
    }
    if (selectedQuestionStatus &&
        selectedQuestionStatus !== "all" &&
        userData &&
        (userData === null || userData === void 0 ? void 0 : userData.usedQuestions.length) > 0) {
        if (selectedQuestionStatus === "used") {
            filter["_id"] = {
                $in: userData === null || userData === void 0 ? void 0 : userData.usedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
            };
        }
        else if (req.body.selectedQuestionStatus === "unused") {
            filter["_id"] = {
                $nin: userData === null || userData === void 0 ? void 0 : userData.usedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
            };
        }
    }
    if (selectedAnswerStatus &&
        selectedAnswerStatus !== "all" &&
        userData &&
        (userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions.length) > 0) {
        if (selectedAnswerStatus === "incorrect") {
            if (filter["_id"]) {
                filter["_id"]["$in"] = ((_y = filter["_id"]) === null || _y === void 0 ? void 0 : _y.$in)
                    ? [
                        ...userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    ]
                    : userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId));
            }
            else {
                filter["_id"] = {};
                filter["_id"]["$in"] = ((_z = filter["_id"]) === null || _z === void 0 ? void 0 : _z.$in)
                    ? [
                        ...userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    ]
                    : userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId));
            }
        }
        else if (selectedAnswerStatus === "correct") {
            if (filter["_id"]) {
                filter["_id"]["$in"] = ((_0 = filter["_id"]) === null || _0 === void 0 ? void 0 : _0.$in)
                    ? [
                        ...userData === null || userData === void 0 ? void 0 : userData.correctQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    ]
                    : userData === null || userData === void 0 ? void 0 : userData.correctQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId));
            }
            else {
                filter["_id"] = {};
                filter["_id"]["$in"] = ((_1 = filter["_id"]) === null || _1 === void 0 ? void 0 : _1.$in)
                    ? [
                        ...userData === null || userData === void 0 ? void 0 : userData.correctQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    ]
                    : userData === null || userData === void 0 ? void 0 : userData.correctQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId));
            }
        }
    }
    if (selectedMarkStatus !== "all") {
        if (userData !== null && (userData === null || userData === void 0 ? void 0 : userData.markedQuestions)) {
            if (selectedMarkStatus === "marked") {
                if (selectedAnswerStatus === "all") {
                    filter["_id"] = {
                        $nin: ((_2 = filter["_id"]) === null || _2 === void 0 ? void 0 : _2.$nin) ? [...filter._id.$nin] : undefined,
                        $in: ((_3 = filter["_id"]) === null || _3 === void 0 ? void 0 : _3.$in)
                            ? [
                                ...userData.markedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                            ]
                            : userData.markedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    };
                }
                else if ((_4 = filter._id) === null || _4 === void 0 ? void 0 : _4.$in) {
                    let filteredIds = filter._id.$in.filter((questionId) => userData !== null
                        ? userData.markedQuestions.includes(questionId.toString())
                        : false);
                    filter._id.$in = filteredIds;
                }
            }
            else if (selectedMarkStatus === "unmarked") {
                if (selectedAnswerStatus === "all") {
                    filter["_id"] = {
                        $in: ((_5 = filter["_id"]) === null || _5 === void 0 ? void 0 : _5.$in) ? [...filter._id.$in] : undefined,
                        $nin: ((_6 = filter["_id"]) === null || _6 === void 0 ? void 0 : _6.$nin)
                            ? [
                                ...userData.markedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                            ]
                            : userData.markedQuestions.map((questionId) => mongoose_1.default.Types.ObjectId.createFromHexString(questionId)),
                    };
                }
                else if ((_7 = filter._id) === null || _7 === void 0 ? void 0 : _7.$in) {
                    let filteredIds = filter._id.$in.filter((questionId) => userData !== null
                        ? userData.markedQuestions.includes(questionId.toString())
                        : false);
                    filter._id.$nin = filteredIds;
                }
            }
        }
    }
    // if (req.body.selectedMarkStatus !== "all") {
    //   if (userData?.markedQuestions) {
    //     if (req.body.selectedMarkStatus === "marked") {
    //       filter["_id"] = {
    //         $nin: filter["_id"]?.$nin ? [...filter._id.$nin] : undefined,
    //         $in: filter["_id"]?.$in
    //           ? [
    //               ...userData.markedQuestions.map((questionId) =>
    //                 mongoose.Types.ObjectId.createFromHexString(questionId)
    //               ),
    //             ]
    //           : userData.markedQuestions.map((questionId) =>
    //               mongoose.Types.ObjectId.createFromHexString(questionId)
    //             ),
    //       };
    //     } else if (req.body.selectedMarkStatus === "unmarked") {
    //       filter["_id"] = {
    //         $in: filter["_id"]?.$in ? [...filter._id.$in] : undefined,
    //         $nin: filter["_id"]?.$nin
    //           ? [
    //               ...userData.markedQuestions.map((questionId) =>
    //                 mongoose.Types.ObjectId.createFromHexString(questionId)
    //               ),
    //             ]
    //           : userData.markedQuestions.map((questionId) =>
    //               mongoose.Types.ObjectId.createFromHexString(questionId)
    //             ),
    //       };
    //     }
    //   }
    // }
    // check if id filters are undefined
    if (((_8 = filter._id) === null || _8 === void 0 ? void 0 : _8.$in) === undefined) {
        (_9 = filter._id) === null || _9 === void 0 ? true : delete _9.$in;
    }
    if (((_10 = filter._id) === null || _10 === void 0 ? void 0 : _10.$nin) === undefined) {
        (_11 = filter._id) === null || _11 === void 0 ? true : delete _11.$nin;
    }
    console.log(filter);
    if (req.body.availableTopics) {
        topicsQuery = yield Question_model_1.Question.aggregate([
            {
                $match: Object.assign({}, filter),
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
                $match: filter,
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
        var _a, _b, _c, _d;
        console.log(question);
        let questionObject = {};
        if (req.query.testStatus !== "completed") {
            if (req.query.selectedLanguage === "es") {
                questionObject = {
                    _id: question === null || question === void 0 ? void 0 : question._id,
                    question: question === null || question === void 0 ? void 0 : question.question,
                    options: question === null || question === void 0 ? void 0 : question.options,
                    imageUrl: question === null || question === void 0 ? void 0 : question.imageUrl,
                    internationalization: {
                        es: {
                            question: (_b = (_a = question === null || question === void 0 ? void 0 : question.internationalization) === null || _a === void 0 ? void 0 : _a.es) === null || _b === void 0 ? void 0 : _b.question,
                            options: (_d = (_c = question === null || question === void 0 ? void 0 : question.internationalization) === null || _c === void 0 ? void 0 : _c.es) === null || _d === void 0 ? void 0 : _d.question,
                        },
                    },
                };
            }
            else {
                questionObject = {
                    _id: question === null || question === void 0 ? void 0 : question._id,
                    question: question === null || question === void 0 ? void 0 : question.question,
                    options: question === null || question === void 0 ? void 0 : question.options,
                    imageUrl: question === null || question === void 0 ? void 0 : question.imageUrl,
                };
            }
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
app.put("/usersData/dashboardTutorial", (req, res, next) => {
    console.log(req.body);
    UserData_model_1.UserData.updateOne({ _id: req.body.userDataId }, { $set: { dashboardTutorial: req.body.dashboardTutorial } })
        .then((result) => res.status(200).json(result))
        .catch((error) => {
        console.error("Failed to update the user data", error);
        res.status(500).send({ error: "Failed to update the user data." });
    });
});
app.put("/usersData/testsTutorial", (req, res, next) => {
    console.log(req.body);
    UserData_model_1.UserData.updateOne({ _id: req.body.userDataId }, { $set: { testsTutorial: req.body.testsTutorial } })
        .then((result) => res.status(200).json(result))
        .catch((error) => {
        console.error("Failed to update the user data", error);
        res.status(500).send({ error: "Failed to update the user data." });
    });
});
// Tests routes
app.get("/tests", (req, res, next) => {
    let { page, userId } = req.query;
    let parsedPage = parseInt(page) || 1;
    const skip = (parsedPage - 1) * 10;
    Test_model_1.Test.find({
        userId,
    })
        .sort("-createdAt")
        .skip(skip)
        .limit(10)
        .then((tests) => {
        Test_model_1.Test.countDocuments({ userId }).then((total) => {
            res.status(200).json({
                tests,
                total,
                pages: Math.ceil(total / 10),
                currentPage: parsedPage,
            });
        });
    })
        .catch((error) => {
        console.error("Error while retrieving the tests", error);
        res.status(500).send({ error: "Failed to retrieve the tests." });
    });
});
app.post("/tests", (req, res, next) => {
    console.log(req.body);
    Test_model_1.Test.create(Object.assign(Object.assign({}, req.body), { questionCount: req.body.questions.length }))
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
app.put("/tests/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    let updateParams = req.body;
    try {
        let userData = yield UserData_model_1.UserData.findOne({ userId: updateParams.userId });
        let updateResult = yield Test_model_1.Test.updateOne({ _id: id }, {
            $set: updateParams,
        });
        return res.status(200).json(updateResult);
    }
    catch (error) {
        console.error("Error updating the test", error);
        res.status(500).json("Error updating the test.");
    }
}));
app.put("/gradetests/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let { id } = req.params;
    let test = req.body;
    test.testStatus = "completed";
    let questionsIds = test.questions.map((question) => question.id);
    let sourceQuestions = [];
    try {
        sourceQuestions = yield Question_model_1.Question.find({ _id: { $in: questionsIds } });
    }
    catch (error) {
        console.log("Error retrieving source questions", error);
        return res.status(500).json("Error updating the test.");
    }
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
        let userData = yield UserData_model_1.UserData.findOne({ userId: test.userId });
        let updateResponse = yield Test_model_1.Test.updateOne({ _id: id }, test);
        let userDataUpdate = {
            usedQuestions: (userData === null || userData === void 0 ? void 0 : userData.usedQuestions)
                ? Array.from(new Set([
                    ...userData.usedQuestions,
                    ...test.questions.map((question) => question.id),
                ]))
                : Array.from(new Set([...test.questions.map((question) => question.id)])),
            correctQuestions: (userData === null || userData === void 0 ? void 0 : userData.correctQuestions)
                ? Array.from(new Set([
                    ...userData.correctQuestions,
                    ...test.questions
                        .filter((question) => question.correct === 1)
                        .map((question) => question.id),
                ]))
                : Array.from(new Set([
                    ...test.questions
                        .filter((question) => question.correct === 1)
                        .map((question) => question.id),
                ])),
            incorrectQuestions: (userData === null || userData === void 0 ? void 0 : userData.incorrectQuestions)
                ? Array.from(new Set([
                    ...userData.incorrectQuestions,
                    ...test.questions
                        .filter((question) => question.correct === 0)
                        .map((question) => question.id),
                ]))
                : Array.from(new Set([
                    ...test.questions
                        .filter((question) => question.correct === 0)
                        .map((question) => question.id),
                ])),
            markedQuestions: (userData === null || userData === void 0 ? void 0 : userData.markedQuestions)
                ? Array.from(new Set([
                    ...userData.markedQuestions,
                    ...test.questions
                        .filter((question) => question.marked === true)
                        .map((question) => question.id),
                ]))
                : Array.from(new Set([
                    ...test.questions
                        .filter((question) => question.marked === true)
                        .map((question) => question.id),
                ])),
        };
        let userDataUpdateResult = yield UserData_model_1.UserData.updateOne({ _id: userData === null || userData === void 0 ? void 0 : userData._id }, {
            $set: userDataUpdate,
        });
        return res.status(200).jsonp({
            testUpdateResult: updateResponse,
            userDataUpdateResult: userDataUpdateResult,
        });
    }
    catch (error) {
        console.error("Error while updating the test grade.", error);
        return res.status(500).json("Couldn't update the test grade.");
    }
}));
app.put("/tests/update-analysis/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        let test = yield Test_model_1.Test.findOne({ _id: id });
        let testSourceQuestions = yield Question_model_1.Question.find({
            _id: { $in: test === null || test === void 0 ? void 0 : test.questions.map((question) => question.id) },
        });
        let testTopics = Array.from(new Set(testSourceQuestions.map((testSourceQuestion) => testSourceQuestion.topic)));
        let testSubtopics = Array.from(new Set(testSourceQuestions.map((testSourceQuestion) => testSourceQuestion.subtopic)));
        let testAnalysis = {
            topicsAnalysis: testTopics.map((topic) => {
                if (topic) {
                    let topicQuestions = testSourceQuestions.filter((sourceQuestion) => sourceQuestion.topic === topic);
                    let correctCount = topicQuestions.reduce((acc, currVal) => {
                        let foundMatch = test === null || test === void 0 ? void 0 : test.questions.find((q) => q.id === currVal._id.toString());
                        return foundMatch ? acc + foundMatch.correct : acc + 0;
                    }, 0);
                    let incorrectCount = topicQuestions.length - correctCount;
                    return {
                        topic: topic,
                        correctCount: correctCount,
                        incorrectCount: incorrectCount,
                        score: correctCount / (correctCount + incorrectCount),
                    };
                }
            }),
            subtopicsAnalysis: testSubtopics.map((subtopic) => {
                if (subtopic) {
                    let subtopicQuestions = testSourceQuestions.filter((sourceQuestion) => sourceQuestion.subtopic === subtopic);
                    let topic;
                    if (subtopicQuestions.length > 0) {
                        topic = subtopicQuestions[0].topic;
                    }
                    let correctCount = subtopicQuestions.reduce((acc, currVal) => {
                        let foundMatch = test === null || test === void 0 ? void 0 : test.questions.find((q) => q.id === currVal._id.toString());
                        return foundMatch ? acc + foundMatch.correct : acc + 0;
                    }, 0);
                    let incorrectCount = subtopicQuestions.length - correctCount;
                    return {
                        topic: topic,
                        subtopic: subtopic,
                        correctCount: correctCount,
                        incorrectCount: incorrectCount,
                        score: correctCount / (correctCount + incorrectCount),
                    };
                }
            }),
        };
        let updateResult = yield Test_model_1.Test.updateOne({ _id: id }, { $set: { analysis: testAnalysis } });
        return res.status(200).json(updateResult);
    }
    catch (error) {
        console.log("Failed to update the test analysis", error);
        return res.status(500).json("Failed to update the test analysis.");
    }
}));
app.post("/create-subscription-checkout-session", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { priceId, isTrial, email } = req.body;
    let subscription_data = {
        trial_settings: {
            end_behavior: {
                missing_payment_method: "cancel",
            },
        },
        trial_period_days: 7,
    };
    if (!isTrial) {
        subscription_data = undefined;
    }
    try {
        const session = yield stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            subscription_data,
            locale: "en",
            payment_method_collection: "always",
            customer_email: email,
            custom_text: {
                submit: {
                    message: isTrial
                        ? "Complete the form to start the 7-day trial. Your card will not be charged at this time. If you cancel the subscription before the trial ends, your credit card will not be charged."
                        : "Complete the form to start your selected subscription. You can cancel your subscription at any time.",
                },
            },
            success_url: process.env.STRIPE_SUCCESS_URL,
            cancel_url: process.env.STRIPE_CANCEL_URL,
        });
        return res.status(200).json(session.url);
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: "Couldn't generate stripe session.", error });
    }
}));
app.post("/create-customer-portal-session", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, return_url } = req.body;
    try {
        const customers = yield stripe.customers.list({
            email: email,
        });
        const customerID = customers.data.length > 0 ? customers.data[0].id : null;
        if (customerID) {
            const session = yield stripe.billingPortal.sessions.create({
                locale: "en",
                customer: customerID,
                return_url,
            });
            return res.status(200).json(session.url);
        }
        else {
            console.log("Customer not found");
            return res.status(400).json("User not found.");
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json("Couldn't create the stripe portal session.");
    }
}));
app.post("/webhooks/stripe", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _12, _13;
    const { id, data, type } = req.body;
    let created = new Date(data.object.created * 1000);
    let expiresAt = new Date(data.object.created_at * 1000);
    expiresAt.setDate(expiresAt.getDate() + 30);
    let subscription;
    try {
        subscription = yield stripe.subscriptions.retrieve(data.object.subscription);
    }
    catch (error) {
        console.log(error);
    }
    if (subscription) {
        created = new Date(subscription.current_period_start * 1000);
        expiresAt = new Date(subscription.current_period_end * 1000);
    }
    console.log(type);
    switch (type) {
        case "invoice.paid":
            let recurrentBilling = {
                checkoutId: data.object.id,
                amountTotal: data.object.amount_total,
                createdAt: created,
                currency: data.object.currency,
                customerEmail: data.object.customer_email,
                customerName: data.object.customer_name,
                expiresAt: expiresAt,
                invoice: data.object.id,
                documentType: "subscription",
                subscriptionId: data.object.subscription,
                status: data.object.status,
                billing_reason: data.object.billing_reason,
            };
            try {
                let response = yield Billing_model_1.Billing.create(recurrentBilling);
                if (process.env.EMAIL_JS_SERVICE_ID &&
                    process.env.EMAIL_JS_PURCHASE_TEMPLATE_ID &&
                    process.env.EMAIL_JS_TRIAL_TEMPLATE_ID &&
                    process.env.EMAIL_JS_PUBLIC_KEY &&
                    process.env.EMAIL_JS_PRIVATE_KEY) {
                    yield nodejs_1.default.send(process.env.EMAIL_JS_SERVICE_ID, data.object.amount_due === 0
                        ? process.env.EMAIL_JS_TRIAL_TEMPLATE_ID
                        : process.env.EMAIL_JS_PURCHASE_TEMPLATE_ID, {
                        recipient_email: data.object.customer_email,
                        user_name: data.object.customer_name,
                        order_number: data.object.id,
                        purchase_date: `${created.getMonth() + 1}/${created.getDate()}/${created.getFullYear()}`,
                        product_name: data.object.lines.data[0].plan.nickname,
                        billing_frequency: data.object.lines.data[0].plan.interval[0].toUpperCase() +
                            data.object.lines.data[0].plan.interval.substring(1),
                        amount_paid: `$ ${(data.object.amount_paid / 100).toFixed(2)} ${(_12 = data.object.currency) === null || _12 === void 0 ? void 0 : _12.toUpperCase()}`,
                        period_end: `${expiresAt.getMonth() + 1}/${expiresAt.getDate()}/${expiresAt.getFullYear()}`,
                        plan_amount: `$ ${(data.object.lines.data[0].plan.amount / 100).toFixed(2)} ${(_13 = data.object.currency) === null || _13 === void 0 ? void 0 : _13.toUpperCase()}`,
                    }, {
                        publicKey: process.env.EMAIL_JS_PUBLIC_KEY,
                        privateKey: process.env.EMAIL_JS_PRIVATE_KEY,
                    });
                }
                console.log(response);
                return res.status(200).json("Updated the purchase information.");
            }
            catch (error) {
                console.error("Couldn't update the billing information", error);
                return res.status(500).json("Couldn't update the billing information.");
            }
        case "customer.subscription.created":
            const { customer } = data.object;
            try {
                if (process.env.EMAIL_JS_SERVICE_ID &&
                    process.env.EMAIL_JS_WELCOME_TEMPLATE_ID &&
                    process.env.EMAIL_JS_PUBLIC_KEY &&
                    process.env.EMAIL_JS_PRIVATE_KEY) {
                    const customerData = yield stripe.customers.retrieve(customer);
                    yield nodejs_1.default.send(process.env.EMAIL_JS_SERVICE_ID, process.env.EMAIL_JS_WELCOME_TEMPLATE_ID, { recipient_email: customerData.email }, {
                        publicKey: process.env.EMAIL_JS_PUBLIC_KEY,
                        privateKey: process.env.EMAIL_JS_PRIVATE_KEY,
                    });
                    return res.status(200).json("Successfully set the welcome email");
                }
                else {
                    console.log("NO EMAIL JS SERVICE DATA");
                    return res.status(500).json("Failed to send the email");
                }
            }
            catch (error) {
                console.log(error);
            }
            break;
        default:
            return res.status(400).json("Event type not supported.");
    }
}));
app.get("/check-subscription/:email", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.params;
    console.log(email);
    const now = new Date();
    try {
        let billings = yield Billing_model_1.Billing.find({
            customerEmail: email,
            expiresAt: { $gt: now },
        });
        return res.status(200).json(billings);
    }
    catch (error) {
        console.error("Error while searching for a valid billing.", error);
        return res.status(500).json("Error while searching for a valid billing.");
    }
}));
app.use("/ticketRoutes", tickets_routes_1.default);
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
module.exports = app;
