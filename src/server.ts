import express from "express";
import dotenv from "dotenv";
import logger from "morgan";
import { Question } from "./models/Question.model";
import { database } from "../database/mongodb";
import { UserData } from "./models/UserData.model";
import cors from "cors";
import { Test } from "./models/Test.model";
import { QuestionFilterType, QuestionDataType } from "./types/QuestionTypes";
import { TestAnalysisDataType, TestDataType } from "./types/TestTypes";
import mongoose from "mongoose";

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
  console.log(req.body);
  const userData = await UserData.findOne({ userId: req.body.userId });
  let filter: QuestionFilterType = {};
  const {
    selectedQuestionStatus,
    selectedAnswerStatus,
    selectedMarkStatus,
    selectedDifficulties,
    selectedTopics,
    selectedSubtopics,
  } = req.body;

  if (selectedDifficulties) {
    let difficulties = selectedDifficulties as Array<{
      value: "hard" | "medium" | "easy";
      label: string;
    }>;
    filter["difficulty_level"] = {
      $in:
        difficulties.findIndex(
          (diff: { value: string; label: string }) => diff.value === "all"
        ) > -1
          ? ["easy", "medium", "hard"]
          : difficulties.map((difficulty) => difficulty.value),
    };
  }

  if (
    selectedQuestionStatus &&
    selectedQuestionStatus !== "all" &&
    userData &&
    userData?.usedQuestions.length > 0
  ) {
    if (selectedQuestionStatus === "used") {
      filter["_id"] = {
        $in: userData?.usedQuestions.map((questionId) =>
          mongoose.Types.ObjectId.createFromHexString(questionId)
        ),
      };
    } else if (req.body.selectedQuestionStatus === "unused") {
      filter["_id"] = {
        $nin: userData?.usedQuestions.map((questionId) =>
          mongoose.Types.ObjectId.createFromHexString(questionId)
        ),
      };
    }
  }

  if (
    selectedAnswerStatus &&
    selectedAnswerStatus !== "all" &&
    userData &&
    userData?.incorrectQuestions.length > 0
  ) {
    if (selectedAnswerStatus === "incorrect") {
      if (filter["_id"]) {
        filter["_id"]["$in"] = filter["_id"]?.$in
          ? [
              ...filter["_id"].$in,
              ...userData?.incorrectQuestions.map((questionId) =>
                mongoose.Types.ObjectId.createFromHexString(questionId)
              ),
            ]
          : userData?.incorrectQuestions.map((questionId) =>
              mongoose.Types.ObjectId.createFromHexString(questionId)
            );
      } else {
        filter["_id"] = {};
        filter["_id"]["$in"] = filter["_id"]?.$in
          ? [
              ...filter["_id"].$in,
              ...userData?.incorrectQuestions.map((questionId) =>
                mongoose.Types.ObjectId.createFromHexString(questionId)
              ),
            ]
          : userData?.incorrectQuestions.map((questionId) =>
              mongoose.Types.ObjectId.createFromHexString(questionId)
            );
      }
    } else if (selectedAnswerStatus === "correct") {
      if (filter["_id"]) {
        filter["_id"]["$in"] = filter["_id"]?.$in
          ? [
              ...filter["_id"].$in,
              ...userData?.correctQuestions.map((questionId) =>
                mongoose.Types.ObjectId.createFromHexString(questionId)
              ),
            ]
          : userData?.correctQuestions.map((questionId) =>
              mongoose.Types.ObjectId.createFromHexString(questionId)
            );
      } else {
        filter["_id"] = {};
        filter["_id"]["$in"] = filter["_id"]?.$in
          ? [
              ...filter["_id"].$in,
              ...userData?.correctQuestions.map((questionId) =>
                mongoose.Types.ObjectId.createFromHexString(questionId)
              ),
            ]
          : userData?.correctQuestions.map((questionId) =>
              mongoose.Types.ObjectId.createFromHexString(questionId)
            );
      }
    }
  }

  if (selectedMarkStatus !== "all") {
    if (userData?.markedQuestions) {
      if (selectedMarkStatus === "marked") {
        filter["_id"] = {
          $nin: filter["_id"]?.$nin ? [...filter._id.$nin] : undefined,
          $in: filter["_id"]?.$in
            ? [
                ...filter["_id"].$in,
                ...userData.markedQuestions.map((questionId) =>
                  mongoose.Types.ObjectId.createFromHexString(questionId)
                ),
              ]
            : userData.markedQuestions.map((questionId) =>
                mongoose.Types.ObjectId.createFromHexString(questionId)
              ),
        };
      } else if (selectedMarkStatus === "unmarked") {
        filter["_id"] = {
          $in: filter["_id"]?.$in ? [...filter._id.$in] : undefined,
          $nin: filter["_id"]?.$nin
            ? [
                ...filter["_id"].$nin,
                ...userData.markedQuestions.map((questionId) =>
                  mongoose.Types.ObjectId.createFromHexString(questionId)
                ),
              ]
            : userData.markedQuestions.map((questionId) =>
                mongoose.Types.ObjectId.createFromHexString(questionId)
              ),
        };
      }
    }
  }

  if (
    !(selectedTopics.findIndex((topic: string | number) => topic === 0) > -1)
  ) {
    filter["topic"] = { $in: selectedTopics };
  }

  if (
    !(
      selectedSubtopics.findIndex(
        (subtopic: string | number) => subtopic === 0
      ) > -1
    )
  ) {
    filter["subtopic"] = { $in: selectedSubtopics };
  }

  // check if id filters are undefined
  if (filter._id?.$in === undefined) {
    delete filter._id?.$in;
  }

  if (filter._id?.$nin === undefined) {
    delete filter._id?.$nin;
  }

  console.log(filter);
  Question.aggregate([
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
});

app.post("/availablequestions", async (req, res, next) => {
  console.log(req.body);
  const userData = await UserData.findOne({ userId: req.body.userId });

  let filter: QuestionFilterType = {};

  const {
    selectedQuestionStatus,
    selectedAnswerStatus,
    selectedMarkStatus,
    selectedDifficulties,
  } = req.body;
  if (selectedDifficulties) {
    let difficulties = selectedDifficulties as Array<{
      value: "hard" | "medium" | "easy";
      label: string;
    }>;
    filter["difficulty_level"] = {
      $in:
        difficulties.findIndex(
          (diff: { value: string; label: string }) => diff.value === "all"
        ) > -1
          ? ["easy", "medium", "hard"]
          : difficulties.map((difficulty) => difficulty.value),
    };
  }

  if (
    selectedQuestionStatus &&
    selectedQuestionStatus !== "all" &&
    userData &&
    userData?.usedQuestions.length > 0
  ) {
    if (selectedQuestionStatus === "used") {
      filter["_id"] = {
        $in: userData?.usedQuestions.map((questionId) =>
          mongoose.Types.ObjectId.createFromHexString(questionId)
        ),
      };
    } else if (req.body.selectedQuestionStatus === "unused") {
      filter["_id"] = {
        $nin: userData?.usedQuestions.map((questionId) =>
          mongoose.Types.ObjectId.createFromHexString(questionId)
        ),
      };
    }
  }

  if (
    selectedAnswerStatus &&
    selectedAnswerStatus !== "all" &&
    userData &&
    userData?.incorrectQuestions.length > 0
  ) {
    if (selectedAnswerStatus === "incorrect") {
      if (filter["_id"]) {
        filter["_id"]["$in"] = filter["_id"]?.$in
          ? [
              ...userData?.incorrectQuestions.map((questionId) =>
                mongoose.Types.ObjectId.createFromHexString(questionId)
              ),
            ]
          : userData?.incorrectQuestions.map((questionId) =>
              mongoose.Types.ObjectId.createFromHexString(questionId)
            );
      } else {
        filter["_id"] = {};
        filter["_id"]["$in"] = filter["_id"]?.$in
          ? [
              ...userData?.incorrectQuestions.map((questionId) =>
                mongoose.Types.ObjectId.createFromHexString(questionId)
              ),
            ]
          : userData?.incorrectQuestions.map((questionId) =>
              mongoose.Types.ObjectId.createFromHexString(questionId)
            );
      }
    } else if (selectedAnswerStatus === "correct") {
      if (filter["_id"]) {
        filter["_id"]["$in"] = filter["_id"]?.$in
          ? [
              ...userData?.correctQuestions.map((questionId) =>
                mongoose.Types.ObjectId.createFromHexString(questionId)
              ),
            ]
          : userData?.correctQuestions.map((questionId) =>
              mongoose.Types.ObjectId.createFromHexString(questionId)
            );
      } else {
        filter["_id"] = {};
        filter["_id"]["$in"] = filter["_id"]?.$in
          ? [
              ...userData?.correctQuestions.map((questionId) =>
                mongoose.Types.ObjectId.createFromHexString(questionId)
              ),
            ]
          : userData?.correctQuestions.map((questionId) =>
              mongoose.Types.ObjectId.createFromHexString(questionId)
            );
      }
    }
  }

  if (selectedMarkStatus !== "all") {
    if (userData?.markedQuestions) {
      if (selectedMarkStatus === "marked") {
        if (selectedAnswerStatus === "all") {
          filter["_id"] = {
            $nin: filter["_id"]?.$nin ? [...filter._id.$nin] : undefined,
            $in: filter["_id"]?.$in
              ? [
                  ...userData.markedQuestions.map((questionId) =>
                    mongoose.Types.ObjectId.createFromHexString(questionId)
                  ),
                ]
              : userData.markedQuestions.map((questionId) =>
                  mongoose.Types.ObjectId.createFromHexString(questionId)
                ),
          };
        } else if (filter._id?.$in) {
          let filteredIds = filter._id.$in.filter((questionId) =>
            userData.markedQuestions.includes(questionId.toString())
          );
          filter._id.$in = filteredIds;
        }
      } else if (selectedMarkStatus === "unmarked") {
        if (selectedAnswerStatus === "all") {
          filter["_id"] = {
            $in: filter["_id"]?.$in ? [...filter._id.$in] : undefined,
            $nin: filter["_id"]?.$nin
              ? [
                  ...userData.markedQuestions.map((questionId) =>
                    mongoose.Types.ObjectId.createFromHexString(questionId)
                  ),
                ]
              : userData.markedQuestions.map((questionId) =>
                  mongoose.Types.ObjectId.createFromHexString(questionId)
                ),
          };
        } else if (filter._id?.$in) {
          let filteredIds = filter._id.$in.filter((questionId) =>
          userData.markedQuestions.includes(questionId.toString())
        );
        filter._id.$nin = filteredIds;
        }
      }
    }
  }

  console.log(filter);

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
  const { selectedQuestionStatus, selectedAnswerStatus, selectedMarkStatus } = req.body;
  let userData = await UserData.findOne({ userId: req.body.userId });
  let filter: QuestionFilterType = {};

  if (req.body.selectedDifficulties) {
    let difficulties = req.body.selectedDifficulties as Array<{
      value: "hard" | "medium" | "easy";
      label: string;
    }>;
    filter["difficulty_level"] = {
      $in:
        difficulties.findIndex(
          (diff: { value: string; label: string }) => diff.value === "all"
        ) > -1
          ? ["easy", "medium", "hard"]
          : difficulties.map((difficulty) => difficulty.value),
    };
  }
  if (userData?.usedQuestions) {
    console.log(
      selectedQuestionStatus &&
        selectedQuestionStatus !== "all" &&
        userData?.usedQuestions.length
    );
  }

  if (
    selectedQuestionStatus &&
    selectedQuestionStatus !== "all" &&
    userData &&
    userData?.usedQuestions.length > 0
  ) {
    if (selectedQuestionStatus === "used") {
      filter["_id"] = {
        $in: userData?.usedQuestions.map((questionId) =>
          mongoose.Types.ObjectId.createFromHexString(questionId)
        ),
      };
    } else if (req.body.selectedQuestionStatus === "unused") {
      filter["_id"] = {
        $nin: userData?.usedQuestions.map((questionId) =>
          mongoose.Types.ObjectId.createFromHexString(questionId)
        ),
      };
    }
  }

  if (
    selectedAnswerStatus &&
    selectedAnswerStatus !== "all" &&
    userData &&
    userData?.incorrectQuestions.length > 0
  ) {
    if (selectedAnswerStatus === "incorrect") {
      if (filter["_id"]) {
        filter["_id"]["$in"] = filter["_id"]?.$in
          ? [
              ...userData?.incorrectQuestions.map((questionId) =>
                mongoose.Types.ObjectId.createFromHexString(questionId)
              ),
            ]
          : userData?.incorrectQuestions.map((questionId) =>
              mongoose.Types.ObjectId.createFromHexString(questionId)
            );
      } else {
        filter["_id"] = {};
        filter["_id"]["$in"] = filter["_id"]?.$in
          ? [
              ...userData?.incorrectQuestions.map((questionId) =>
                mongoose.Types.ObjectId.createFromHexString(questionId)
              ),
            ]
          : userData?.incorrectQuestions.map((questionId) =>
              mongoose.Types.ObjectId.createFromHexString(questionId)
            );
      }
    } else if (selectedAnswerStatus === "correct") {
      if (filter["_id"]) {
        filter["_id"]["$in"] = filter["_id"]?.$in
          ? [
              ...userData?.correctQuestions.map((questionId) =>
                mongoose.Types.ObjectId.createFromHexString(questionId)
              ),
            ]
          : userData?.correctQuestions.map((questionId) =>
              mongoose.Types.ObjectId.createFromHexString(questionId)
            );
      } else {
        filter["_id"] = {};
        filter["_id"]["$in"] = filter["_id"]?.$in
          ? [
              ...userData?.correctQuestions.map((questionId) =>
                mongoose.Types.ObjectId.createFromHexString(questionId)
              ),
            ]
          : userData?.correctQuestions.map((questionId) =>
              mongoose.Types.ObjectId.createFromHexString(questionId)
            );
      }
    }
  }

  
  if (selectedMarkStatus !== "all") {
    if (userData !== null && userData?.markedQuestions) {
      if (selectedMarkStatus === "marked") {
        if (selectedAnswerStatus === "all") {
          filter["_id"] = {
            $nin: filter["_id"]?.$nin ? [...filter._id.$nin] : undefined,
            $in: filter["_id"]?.$in
              ? [
                  ...userData.markedQuestions.map((questionId) =>
                    mongoose.Types.ObjectId.createFromHexString(questionId)
                  ),
                ]
              : userData.markedQuestions.map((questionId) =>
                  mongoose.Types.ObjectId.createFromHexString(questionId)
                ),
          };
        } else if (filter._id?.$in) {
          let filteredIds = filter._id.$in.filter((questionId) => userData !== null ? userData.markedQuestions.includes(questionId.toString()) : false);
          filter._id.$in = filteredIds;
        }
      } else if (selectedMarkStatus === "unmarked") {
        if (selectedAnswerStatus === "all") {
          filter["_id"] = {
            $in: filter["_id"]?.$in ? [...filter._id.$in] : undefined,
            $nin: filter["_id"]?.$nin
              ? [
                  ...userData.markedQuestions.map((questionId) =>
                    mongoose.Types.ObjectId.createFromHexString(questionId)
                  ),
                ]
              : userData.markedQuestions.map((questionId) =>
                  mongoose.Types.ObjectId.createFromHexString(questionId)
                ),
          };
        } else if (filter._id?.$in) {
          let filteredIds = filter._id.$in.filter((questionId) =>
          userData !== null ? userData.markedQuestions.includes(questionId.toString()) : false
        );
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
  if (filter._id?.$in === undefined) {
    delete filter._id?.$in;
  }

  if (filter._id?.$nin === undefined) {
    delete filter._id?.$nin;
  }

  console.log(filter);

  if (req.body.availableTopics) {
    topicsQuery = await Question.aggregate([
      {
        $match: {
          ...filter,
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
    questionCount: req.body.questions.length,
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

app.put("/tests/:id", async (req, res, next) => {
  const { id } = req.params;
  let updateParams: TestDataType = req.body;

  try {
    let userData = await UserData.findOne({ userId: updateParams.userId });
    let updateResult = await Test.updateOne(
      { _id: id },
      {
        $set: updateParams,
      }
    );

    return res.status(200).json(updateResult);
  } catch (error) {
    console.error("Error updating the test", error);
    res.status(500).json("Error updating the test.");
  }
});

app.put("/gradetests/:id", async (req, res, next) => {
  let { id } = req.params;
  let test: TestDataType = req.body;
  test.testStatus = "completed";

  let questionsIds = test.questions.map((question) => question.id);
  let sourceQuestions: QuestionDataType[] = [];

  try {
    sourceQuestions = await Question.find({ _id: { $in: questionsIds } });
  } catch (error) {
    console.log("Error retrieving source questions", error);
    return res.status(500).json("Error updating the test.");
  }

  test.questions.forEach((question, index) => {
    let questionData = sourceQuestions.find((sourceQuestion) => {
      return question.id === sourceQuestion._id.toString();
    });

    if (questionData?._id) {
      console.log("ran correct update");
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
    let userData = await UserData.findOne({ userId: test.userId });
    let updateResponse = await Test.updateOne({ _id: id }, test);

    let userDataUpdate = {
      usedQuestions: userData?.usedQuestions
        ? Array.from(
            new Set([
              ...userData.usedQuestions,
              ...test.questions.map((question) => question.id),
            ])
          )
        : Array.from(
            new Set([...test.questions.map((question) => question.id)])
          ),
      correctQuestions: userData?.correctQuestions
        ? Array.from(
            new Set([
              ...userData.correctQuestions,
              ...test.questions
                .filter((question) => question.correct === 1)
                .map((question) => question.id),
            ])
          )
        : Array.from(
            new Set([
              ...test.questions
                .filter((question) => question.correct === 1)
                .map((question) => question.id),
            ])
          ),
      incorrectQuestions: userData?.incorrectQuestions
        ? Array.from(
            new Set([
              ...userData.incorrectQuestions,
              ...test.questions
                .filter((question) => question.correct === 0)
                .map((question) => question.id),
            ])
          )
        : Array.from(
            new Set([
              ...test.questions
                .filter((question) => question.correct === 0)
                .map((question) => question.id),
            ])
          ),
      markedQuestions: userData?.markedQuestions
        ? Array.from(
            new Set([
              ...userData.markedQuestions,
              ...test.questions
                .filter((question) => question.marked === true)
                .map((question) => question.id),
            ])
          )
        : Array.from(
            new Set([
              ...test.questions
                .filter((question) => question.marked === true)
                .map((question) => question.id),
            ])
          ),
    };

    let userDataUpdateResult = await UserData.updateOne(
      { _id: userData?._id },
      {
        $set: userDataUpdate,
      }
    );

    return res.status(200).jsonp({
      testUpdateResult: updateResponse,
      userDataUpdateResult: userDataUpdateResult,
    });
  } catch (error) {
    console.error("Error while updating the test grade.", error);
    return res.status(500).json("Couldn't update the test grade.");
  }
});

app.put("/tests/update-analysis/:id", async (req, res, next) => {
  const { id } = req.params;

  try {
    let test = await Test.findOne({ _id: id });
    let testSourceQuestions: QuestionDataType[] = await Question.find({
      _id: { $in: test?.questions.map((question) => question.id) },
    });
    let testTopics: string[] = Array.from(
      new Set(
        testSourceQuestions.map(
          (testSourceQuestion) => testSourceQuestion.topic
        )
      )
    ) as string[];

    let testSubtopics: string[] = Array.from(
      new Set(
        testSourceQuestions.map(
          (testSourceQuestion) => testSourceQuestion.subtopic
        )
      )
    ) as string[];

    let testAnalysis: TestAnalysisDataType = {
      topicsAnalysis: testTopics.map((topic) => {
        if (topic) {
          let topicQuestions = testSourceQuestions.filter(
            (sourceQuestion) => sourceQuestion.topic === topic
          );
          let correctCount = topicQuestions.reduce((acc, currVal) => {
            let foundMatch = test?.questions.find(
              (q) => q.id === currVal._id.toString()
            );

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
          let subtopicQuestions = testSourceQuestions.filter(
            (sourceQuestion) => sourceQuestion.subtopic === subtopic
          );

          let topic;
          if (subtopicQuestions.length > 0) {
            topic = subtopicQuestions[0].topic;
          }

          let correctCount = subtopicQuestions.reduce((acc, currVal) => {
            let foundMatch = test?.questions.find(
              (q) => q.id === currVal._id.toString()
            );
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

    let updateResult = await Test.updateOne(
      { _id: id },
      { $set: { analysis: testAnalysis } }
    );

    return res.status(200).json(updateResult);
  } catch (error) {
    console.log("Failed to update the test analysis", error);
    return res.status(500).json("Failed to update the test analysis.");
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

module.exports = app;
