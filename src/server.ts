import express from "express";
import dotenv from "dotenv";
import logger from "morgan";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;


app.use(logger('dev'));
    
app.use(express.static('public'));

app.get("/", (req, res) => {
  res.send("Express + TypeScript Server");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
