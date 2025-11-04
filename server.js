import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import PDFDocument from "pdfkit";
import Mark from "./models/Mark.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// Add Marks
app.post("/upload", async (req, res) => {
  try {
    const mark = new Mark(req.body);
    await mark.save();
    res.json({ success: true, message: "Marks uploaded successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all marks + rank calculation
app.get("/marks", async (req, res) => {
  const marks = await Mark.find({});
  const sorted = marks.sort((a, b) => b.obtainedMarks - a.obtainedMarks);
  const ranked = sorted.map((m, i) => ({ ...m._doc, rank: i + 1 }));
  res.json(ranked);
});

// Update mark
app.put("/marks/:id", async (req, res) => {
  try {
    const updated = await Mark.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete mark
app.delete("/marks/:id", async (req, res) => {
  try {
    await Mark.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Mark deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate student PDF report
app.get("/report/:roll", async (req, res) => {
  const { roll } = req.params;
  const marks = await Mark.find({ roll });
  if (!marks.length) return res.status(404).send("No data found");

  const doc = new PDFDocument();
  const filePath = `report-${roll}.pdf`;
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text(`Student Report - Roll: ${roll}`, { align: "center" });
  doc.moveDown();
  marks.forEach((m) => {
    doc.fontSize(14).text(`${m.month} | Obtained: ${m.obtainedMarks}/${m.totalMarks}`);
  });
  doc.end();

  setTimeout(() => {
    res.download(filePath, () => fs.unlinkSync(filePath));
  }, 800);
});

app.listen(process.env.PORT, () =>
  console.log(`🚀 Server running on port ${process.env.PORT}`)
);
