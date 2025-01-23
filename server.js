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
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 }, // إضافة حقل الرصيد
});

const User = mongoose.model("User", UserSchema);

// نموذج الإيداع
const DepositSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  phone: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const Deposit = mongoose.model("Deposit", DepositSchema);

// مسار التسجيل
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "يرجى إدخال اسم المستخدم وكلمة المرور",
    });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "اسم المستخدم موجود مسبقًا",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

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
    const user = await User.findOne({ username });
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

    res.status(200).json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
    });
  } catch (error) {
    console.error("❌ خطأ أثناء تسجيل الدخول:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تسجيل الدخول",
    });
  }
});

// مسار الإيداع
app.post("/deposit", async (req, res) => {
  const { depositAmount, depositPhone, phoneNumber, username } = req.body;

  if (!depositAmount || !depositPhone || !phoneNumber || !username) {
    return res.status(400).json({
      success: false,
      message: "يرجى إدخال كافة البيانات المطلوبة",
    });
  }

  try {
    // التحقق من أن رقم الهاتف يحتوي على 11 رقم
    if (depositPhone.length !== 11) {
      return res.status(400).json({
        success: false,
        message: "رقم الهاتف يجب أن يكون 11 رقمًا",
      });
    }

    // التحقق من وجود المستخدم
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود",
      });
    }

    // إضافة المبلغ إلى رصيد المستخدم
    user.balance += depositAmount; // إضافة المبلغ إلى الرصيد الحالي للمستخدم
    await user.save();

    // إضافة الإيداع في قاعدة البيانات
    const newDeposit = new Deposit({
      amount: depositAmount,
      phone: depositPhone,
      phoneNumber,
    });

    await newDeposit.save();

    res.status(201).json({
      success: true,
      message: `تم الإيداع بنجاح. رصيدك الحالي: ${user.balance} جنيه`,
    });
  } catch (error) {
    console.error("❌ خطأ أثناء الإيداع:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء الإيداع",
    });
  }
});

app.get("/", (req, res) => {
  res.send("الخادم يعمل بنجاح!");
});

app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});
