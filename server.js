import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import loginHandler from "./api/login.js";
import registerHandler from "./api/register.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// اتصال قاعدة البيانات
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ تم الاتصال بقاعدة البيانات"))
  .catch(err => console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err));

// المسارات
app.get("/", (req, res) => res.send("الخادم يعمل بنجاح!"));

// الربط بمسارات API
app.post("/login", loginHandler);
app.post("/register", registerHandler);

// بدء الخادم
app.listen(PORT, () => console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`));
