import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Conversation from "../models/Conversation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ✅ CHỈ dùng 1 lần
dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

console.log("ENV PATH:", path.resolve(__dirname, "../../.env"));
console.log("MONGODB_CONNECTION_STRING:", process.env.MONGODB_CONNECTION_STRING); // 👈 debug

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);

    console.log("Connected DB");

    const result = await Conversation.updateMany(
      { group: { $type: "array" } },
      [
        {
          $set: {
            group: { $arrayElemAt: ["$group", 0] }
          }
        }
      ],
      { updatePipeline: true }
    );

    console.log("Updated:", result.modifiedCount);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();