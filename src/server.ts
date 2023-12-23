import express from "express";
import dotenv from "dotenv";
import logger from "morgan";
import { Question } from "../models/Question.model";
import { database } from "../database/mongodb";

dotenv.config();

database
const app = express();
const port = process.env.PORT || 3000;

app.use(logger("dev"));

app.use(express.static("public"));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Express + TypeScript Server");
});

app.get("/questions", (req, res, next) => {
    Question.find({})
    .then((questions) => res.status(200).json(questions))
    .catch((error) => {
        console.error("Error while retrieving the question", error)
        res.status(500).send({error: "Failed to retrieve the questions."})
    })
})

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
