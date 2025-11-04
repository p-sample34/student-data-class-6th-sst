import mongoose from "mongoose";

const markSchema = new mongoose.Schema({
  name: String,
  roll: String,
  totalMarks: Number,
  obtainedMarks: Number,
  month: String,
  date: { type: Date, default: Date.now }
});

export default mongoose.model("Mark", markSchema);
