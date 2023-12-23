import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import logger from "morgan";

type MiddlewareFunctionType = (req: Request, res: Response, next: NextFunction) => void

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;


app.use(logger('dev'));

app.use(express.static('public'));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Express + TypeScript Server");
});

app.get("/tests", (req, res) => {
    res.send("We made it to the tests.")
})

app.get('/data', (req, res) => {
    const user = {
      name: "Jane Doe",
      age: 33,
      profession: "Developer"
    };
   
    // Send JSON data in the response
    res.json(user);
  });

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
