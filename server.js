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
  balance: { type: Number, default: 0 }, // حقل الرصيد
});

const User = mongoose.model("User", UserSchema);

// نموذج الإيداع
const DepositSchema = new mongoose.Schema({
  username: { type: String, required: true }, // ربط الإيداع بالمستخدم
  amount: { type: Number, required: true }, // المبلغ
  phone: { type: String, required: true }, // الهاتف
  phoneNumber: { type: String, required: true }, // رقم الهاتف المختار
  date: { type: Date, default: Date.now }, // تاريخ الإيداع
  status: { type: String, default: "Pending" }, // حالة الإيداع (معلق، مكتمل)
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
  const { username, depositAmount, depositPhone, phoneNumber } = req.body;

  if (!username || !depositAmount || !depositPhone || !phoneNumber) {
    return res.status(400).json({
      success: false,
      message: "يرجى إدخال جميع البيانات المطلوبة",
    });
  }

  if (depositPhone.length !== 11) {
    return res.status(400).json({
      success: false,
      message: "رقم الهاتف يجب أن يكون 11 رقمًا",
    });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود",
      });
    }

    // تسجيل طلب الإيداع فقط دون تعديل الرصيد
    const newDeposit = new Deposit({
      username,
      amount: depositAmount,
      phone: depositPhone,
      phoneNumber,
    });

    await newDeposit.save();

    res.status(201).json({
      success: true,
      message: "يرجى الانتظار، سيتم إضافة الرصيد لاحقًا.",
    });
  } catch (error) {
    console.error("❌ خطأ أثناء تسجيل طلب الإيداع:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تسجيل طلب الإيداع",
    });
  }
});

// تحديث الرصيد بناءً على حالة الإيداع

// مسار لتحديث حالة الإيداع وزيادة الرصيد إذا كانت الحالة مكتملة
app.put("/update-deposit-status", async (req, res) => {
  const { depositId, newStatus } = req.body;

  if (!depositId || !newStatus) {
    return res.status(400).json({
      success: false,
      message: "يرجى إرسال معرف الإيداع والحالة الجديدة",
    });
  }

  try {
    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "الإيداع غير موجود",
      });
    }

    // تأكد من أن الإيداع في الحالة الصحيحة
    if (deposit.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "تمت معالجة هذا الإيداع مسبقًا",
      });
    }
    
    if (newStatus === "Completed" && deposit.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "لا يمكن تحديث الإيداع إلى 'Completed' إلا بعد أن يكون في حالة 'Pending'",
      });
    }

    const user = await User.findOne({ username: deposit.username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود",
      });
    }

    // إذا كانت الحالة جديدة "Completed"، أضف المبلغ إلى رصيد المستخدم
    if (newStatus === "Completed") {
      user.balance += deposit.amount;
      await user.save(); // تأكد من حفظ التحديث
    }

    deposit.status = newStatus; // تحديث حالة الإيداع
    await deposit.save(); // تأكد من حفظ حالة الإيداع الجديدة

    res.status(200).json({
      success: true,
      message: `تم تحديث الإيداع إلى الحالة: ${newStatus}`,
    });
  } catch (error) {
    console.error("❌ خطأ أثناء تحديث حالة الإيداع:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث حالة الإيداع",
    });
  }
});
    // مسار Polling للتحقق من حالة الإيداع
app.get("/poll-deposit-status/:depositId", async (req, res) => {
  const { depositId } = req.params;

  try {
    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "الإيداع غير موجود",
      });
    }

    res.status(200).json({
      success: true,
      status: deposit.status,
      depositId: deposit._id,
    });
  } catch (error) {
    console.error("❌ خطأ أثناء التحقق من حالة الإيداع:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء التحقق من حالة الإيداع",
    });
  }
});
    // تحديث الرصيد
    user.balance += deposit.amount;
    await user.save();

    // تحديث حالة الإيداع
    deposit.status = "Completed";
    await deposit.save();

    res.status(200).json({
      success: true,
      message: "تم تحديث الرصيد بنجاح",
    });
  } catch (error) {
    console.error("❌ خطأ أثناء تحديث الرصيد:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث الرصيد",
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
