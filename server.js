import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // تحميل متغيرات البيئة من ملف .env

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ تم الاتصال بقاعدة البيانات"))
  .catch(err => console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err));

// نموذج المستخدم
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

// المسارات
app.get("/", (req, res) => {
  res.send("الخادم يعمل بنجاح!");
});

// مسار التسجيل
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // التحقق من البيانات
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "يرجى إدخال اسم المستخدم وكلمة المرور",
    });
  }

  try {
    // التحقق من أن اسم المستخدم غير موجود مسبقًا
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "اسم المستخدم موجود مسبقًا",
      });
    }

    // إنشاء مستخدم جديد
    const newUser = new User({ username, password });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "تم التسجيل بنجاح",
    });
  } catch (error) {
    console.error("❌ خطأ أثناء معالجة التسجيل:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء التسجيل",
    });
  }
});

// إعداد الخادم للاستماع
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});
