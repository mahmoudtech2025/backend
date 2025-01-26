const express = require("express");
const { MongoClient } = require("mongodb");  // استيراد MongoClient
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// الاتصال بقاعدة البيانات باستخدام MongoClient
const client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect()
  .then(() => console.log("✅ تم الاتصال بقاعدة البيانات"))
  .catch((err) => console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err));

// اختيار قاعدة البيانات والمجموعة (Collection)
const db = client.db("earn-money");  // اسم قاعدة البيانات
const usersCollection = db.collection("users");  // اسم المجموعة

// مسار التسجيل
app.post("/register", async (req, res) => {
  const { username, password, email } = req.body;
  console.log(req.body);  // تحقق من البيانات المستلمة

  if (!username || !password || !email) {
    return res.status(400).json({
      success: false,
      message: "يرجى إدخال اسم المستخدم وكلمة المرور والإيميل",
    });
  }

  try {
    const existingUser = await usersCollection.findOne({ username });
    const existingEmail = await usersCollection.findOne({ email });
    if (existingUser || existingEmail) {
      return res.status(400).json({
        success: false,
        message: "اسم المستخدم أو الإيميل موجود مسبقًا",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, password: hashedPassword, email };
    await usersCollection.insertOne(newUser);

    res.status(201).json({
      success: true,
      message: "تم التسجيل بنجاح",
    });
  } catch (error) {
    console.error("❌ خطأ أثناء التسجيل:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء التسجيل",
    });
  }
});

// مسار تسجيل الدخول
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "يرجى إدخال اسم المستخدم وكلمة المرور",
    });
  }

  try {
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "اسم المستخدم غير موجود",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "كلمة المرور غير صحيحة",
      });
    }

    // إنشاء التوكن عند تسجيل الدخول بنجاح
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      token: token, // إرسال التوكن للعميل
    });
  } catch (error) {
    console.error("❌ خطأ أثناء تسجيل الدخول:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تسجيل الدخول",
    });
  }
});

// مسار جلب بيانات المستخدم
app.get("/getUserData", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // استخراج التوكن من الهيدر

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "توكن غير موجود",
    });
  }

  try {
    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // العثور على المستخدم باستخدام المعرف الموجود في التوكن
    const user = await usersCollection.findOne({ _id: decoded.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود",
      });
    }

    // إرسال بيانات المستخدم
    res.status(200).json({
      success: true,
      username: user.username,
      balance: user.balance, // تأكد من أن حقل الرصيد موجود في نموذج المستخدم
    });
  } catch (error) {
    console.error("❌ خطأ أثناء جلب بيانات المستخدم:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب بيانات المستخدم",
    });
  }
});

// التأكد من عمل الخادم
app.get("/", (req, res) => {
  res.send("الخادم يعمل بنجاح!");
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});
