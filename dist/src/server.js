"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const Question_model_1 = require("../models/Question.model");
const mongodb_1 = require("../database/mongodb");
dotenv_1.default.config();
mongodb_1.database;
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.static("public"));
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("Express + TypeScript Server");
});
app.get("/questions", (req, res, next) => {
    Question_model_1.Question.find({})
        .then((questions) => res.status(200).json(questions))
        .catch((error) => {
        console.error("Error while retrieving the question", error);
        res.status(500).send({ error: "Failed to retrieve the questions." });
    });
});
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
module.exports = app;
