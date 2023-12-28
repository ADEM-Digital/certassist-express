import express from "express";
import dotenv from "dotenv";
import logger from "morgan";
import { Question } from "./models/Question.model";
import { database } from "../database/mongodb";
import { UserData } from "./models/UserData.model";
import cors from "cors";
import { Test } from "./models/Test.model";
import { QuestionFilterType, QuestionDataType } from "./types/QuestionTypes";
import { Topic } from "./models/Topic.model";
import { Subtopic } from "./models/Subtopic.model";
import { error } from "console";
import { TestDataType } from "./types/TestTypes";

dotenv.config();

database;
const app = express();
const port = process.env.PORT || 3000;

app.use(logger("dev"));

app.use(express.static("public"));

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Express + TypeScript Server");
});

// Questions routes
app.get("/questions", (req, res, next) => {
  Question.find({})
    .then((questions) => res.status(200).json(questions))
    .catch((error) => {
      console.error("Error while retrieving the question", error);
      res.status(500).send({ error: "Failed to retrieve the questions." });
    });
});

app.post("/questions/ids", async (req, res, next) => {
  const userData = await UserData.findOne({ userId: req.query.userId });
  let filter: QuestionFilterType = {};

  if (req.body.selectedDifficulties) {
    filter["difficulty_level"] = { $in: req.body.selectedDifficulties };
  }

  if (req.body.selectedQuestionStatus !== "all") {
    if (req.body.selectedQuestionStatus === "used") {
      filter["_id"] = { $in: userData?.usedQuestions };
    } else if (req.body.selectedQuestionStatus === "unused") {
      filter["_id"] = { $nin: userData?.usedQuestions };
    }
  }

  Question.aggregate([
    { $match: filter },
    { $sample: { size: req.body.questionCount } },
    { $project: { _id: 1 } },
  ])
    .then((questions) =>
      res.status(200).json(questions.map((question) => question._id))
    )
    .catch((error) => {
      console.error("Error while retrieving the question", error);
      res.status(500).send({ error: "Failed to retrieve the questions." });
    });
});

app.get("/availablequestions", async (req, res, next) => {
  console.log(req.query);
  const userData = await UserData.find({ userId: req.query.userId });

  let filter: QuestionFilterType = {};

  if (req.query.selectedDifficulties) {
    let difficulties = req.query.selectedDifficulties as Array<{
      value: "hard" | "medium" | "easy";
      label: string;
    }>;
    filter["difficulty_level"] = {
      $in: difficulties.map((difficulty) => difficulty.value),
    };
  }

  if (
    req.query.selectedQuestionStatus &&
    req.query.selectedQuestionStatus !== "all"
  ) {
    if (req.query.selectedQuestionStatus === "unused") {
      filter["_id"] = {
        $nin: userData.map((users) => users.usedQuestions).flat(),
      };
    } else if (req.query.selectedQuestionStatus === "used") {
      filter["_id"] = {
        $in: userData.map((users) => users.usedQuestions).flat(),
      };
    }
  }

  Question.find({
    ...filter,
  })
    .select("_id difficulty_level topic subtopic")
    .then((questions) => res.status(200).json(questions))
    .catch((error) => {
      console.error("Error while retrieving the questions", error);
      res.status(500).send({ error: "Failed to retrieve the questions." });
    });
});

app.post("/availableQuestionOptions", async (req, res, next) => {
  let topicsQuery: {
    _id: string;
    topic?: string;
    name?: string;
    totalQuestions: number;
  }[] = [];
  let subtopicsQuery: {
    _id: string;
    topic: string;
    subtopic?: string;
    name: string;
    totalQuestions: number;
  }[] = [];

  if (req.body.availableTopics) {
    topicsQuery = await Question.aggregate([
      {
        $match: {
          topic: { $in: req.body.availableTopics },
          difficulty_level: {
            $in: req.body.selectedDifficulties.map(
              (diff: { value: string; label: string }) => diff.value
            ),
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

    topicsQuery = topicsQuery.map(
      (topic: {
        _id: string;
        topic?: string | undefined;
        name?: string | undefined;
        totalQuestions: number;
      }) => ({
        _id: topic._id,
        name: topic._id,
        totalQuestions: topic.totalQuestions,
      })
    );
    console.log(topicsQuery);
  }

  if (req.body.availableSubtopics) {
    subtopicsQuery = await Question.aggregate([
      {
        $match: {
          subtopic: { $in: req.body.availableSubtopics },
          difficulty_level: {
            $in: req.body.selectedDifficulties.map(
              (diff: { value: string; label: string }) => diff.value
            ),
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

    subtopicsQuery = subtopicsQuery.map(
      (subtopic: {
        _id: string;
        topic: string;
        subtopic?: string;
        totalQuestions: number;
      }) => ({
        _id: subtopic._id,
        topic: subtopic.topic,
        name: subtopic._id,
        totalQuestions: subtopic.totalQuestions,
      })
    );
    console.log(subtopicsQuery);
  }

  return res.status(200).json({ topicsQuery, subtopicsQuery });
});

app.get("/questions/:id", (req, res, next) => {
  let { id } = req.params;

  Question.findOne({
    _id: id,
  })
    .then((question) => {
      let questionObject = {};
      if (req.query.testStatus !== "completed") {
        questionObject = {
          _id: question?._id,
          question: question?.question,
          options: question?.options,
        };
      } else {
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
  UserData.find({ userId: req.query.userId })
    .then((userData) => res.status(200).json(userData))
    .catch((error) => {
      console.error("Error while retrieving the user data", error);
      res.status(500).send({ error: "Failed to retrieve the user data." });
    });
});

app.post("/usersData", (req, res, next) => {
  console.log(req.body);
  UserData.create({
    ...req.body,
  })
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
  UserData.updateOne(
    { _id: req.body.userDataId },
    { $set: req.body.usedQuestions }
  )
    .then((result) => res.status(200).json(result))
    .catch((error) => {
      console.error("Failed to update the user data", error);
      res.status(500).send({ error: "Failed to update the user data." });
    });
});

// Tests routes
app.get("/tests", (req, res, next) => {
  console.log(req.query.userId);
  Test.find({
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
  Test.create({
    ...req.body,
  })
    .then((test) => res.status(200).json(test))
    .catch((error) => {
      console.error("Error while creating the test", error);
      res.status(500).send({ error: "Failed to create the test." });
    });
});

app.delete("/tests", (req, res, next) => {
  console.log(req.query);
  Test.deleteOne({ _id: req.query.testId })
    .then((result) => res.status(200).json(result))
    .catch((error) => {
      console.error("Error deleting the test", error);
      res.status(500).json("Error while deleting the test.");
    });
});

app.get("/tests/:id", (req, res, next) => {
  const { id } = req.params;

  Test.findOne({ _id: id })
    .then((test) => res.status(200).json(test))
    .catch((error) => {
      console.error("Couldn't find a test", error);
      res.status(500).json("Couldn't find a test");
    });
});

app.put("/tests/:id", (req, res, next) => {
  const { id } = req.params;
  let updateParams: TestDataType = req.body;

  console.log(updateParams);
  Test.updateOne(
    { _id: id },
    {
      $set: updateParams,
    }
  )
    .then((test) => res.status(200).json(test))
    .catch((error) => {
      console.error("Error updating the test", error);
      res.status(500).json("Error updating the test.");
    });
});

app.put("/gradetests/:id", async (req, res, next) => {
  let { id } = req.params;
  let test: TestDataType = req.body;
  test.testStatus = "completed";

  console.log(test);

  let questionsIds = test.questions.map((question) => question.id);
  let sourceQuestions: QuestionDataType[] = [];

  try {
    sourceQuestions = await Question.find({ _id: { $in: questionsIds } });
  } catch (error) {
    console.log("Error retrieving source questions", error);
    return res.status(500).json("Error updating the test.");
  }

  console.log(sourceQuestions.length)
  
  test.questions.forEach((question, index) => {
    let questionData = sourceQuestions.find(
      (sourceQuestion) => {
        return question.id === sourceQuestion._id.toString()}
    );
    
    if (questionData?._id) {
        console.log("ran correct update")
      test.questions[index].correct =
        questionData.correct_answer === question.answer ? 1 : 0;
    }
  });

  test.grade =
    (test.questions.reduce(
      (acc, currVal) =>
        currVal.correct === null ? acc + 0 : acc + currVal.correct,
      0
    ) /
      test.questionCount) *
    100;

  try {
    let updateResponse = await Test.updateOne({ _id: id }, test);

    return res.status(200).jsonp(updateResponse);
  } catch (error) {
    console.error("Error while updating the test grade.", error);
     return res.status(500).json("Couldn't update the test grade.");
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

module.exports = app;
