import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const connectionString = process.env.MONGO_DB_CONNECTION_STRING;

export let database = mongoose;

if (connectionString) {
  database
    .connect(connectionString)
    .then((x) =>
      console.log(
        `Connected to Mongo! Database name: "${x.connections[0].name}"`
      )
    )
    .catch((err) => console.error("Error connecting to mongo", err));
}

