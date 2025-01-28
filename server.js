const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// الاتصال بقاعدة البيانات
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ تم الاتصال بقاعدة البيانات"))
  .catch((err) => console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err));

// نموذج المستخدم
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // حقل username
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 }, // حقل balance مع قيمة افتراضية 0
});

const Users = mongoose.model("users", UserSchema);

// مسار التسجيل
app.post("/register", async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({
      success: false,
      message: "يرجى إدخال اسم المستخدم وكلمة المرور والإيميل",
    });
  }

  try {
    const existingUser = await Users.findOne({ username });
    const existingEmail = await Users.findOne({ email });
    if (existingUser || existingEmail) {
      return res.status(400).json({
        success: false,
        message: "اسم المستخدم أو الإيميل موجود مسبقًا",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Users({ username, password: hashedPassword, email });
    await newUser.save();

    // جلب بيانات المستخدم بعد التسجيل
    const userData = {
      username: newUser.username,
      balance: newUser.balance || 0,
    };

    res.status(201).json({
      success: true,
      message: "تم التسجيل بنجاح",
      user: userData, // إرجاع بيانات المستخدم الجديدة
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
    const user = await Users.findOne({ username });
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

    // جلب بيانات المستخدم بعد تسجيل الدخول
    const userData = {
      username: user.username,
      balance: user.balance || 0,
    };

    res.status(200).json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      user: userData, // إرجاع بيانات المستخدم
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
app.get("/user/:username", async (req, res) => {
       const { username } = req.params;

       try {
         const user = await Users.findOne({ username: new RegExp("^" + username + "$", "i") });
         if (!user) {
           return res.status(404).json({
             success: false,
             message: "المستخدم غير موجود",
           });
         }

         const userData = {
           username: user.username,
           balance: user.balance || 0,
         };

         res.status(200).json({
           success: true,
           data: userData,
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
