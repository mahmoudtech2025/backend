// استيراد الحزم المطلوبة
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config(); // قراءة إعدادات ملف .env

// إنشاء تطبيق Express
const app = express();

// إعداد الوسطاء (Middleware)
app.use(bodyParser.json()); // لمعالجة بيانات JSON
app.use(cors()); // السماح بطلبات من نطاقات مختلفة

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ تم الاتصال بقاعدة البيانات"))
    .catch(err => console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err));

// تعريف نموذج المستخدم
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

// مسار تسجيل المستخدمين
app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    // التحقق من صحة البيانات المدخلة
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "يرجى إدخال اسم المستخدم وكلمة المرور"
        });
    }

    try {
        // إنشاء مستخدم جديد
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({
            success: true,
            message: "تم التسجيل بنجاح"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "حدث خطأ أثناء التسجيل"
        });
    }
});

// مسار افتراضي للاختبار
app.get("/", (req, res) => {
    res.send("🚀 الخادم يعمل بنجاح!");
});

// تشغيل الخادم
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`));
