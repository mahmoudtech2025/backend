import mongoose from "mongoose";
import bcrypt from "bcrypt";

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ تم الاتصال بقاعدة البيانات"))
  .catch(err => console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err));

// تعريف نموذج المستخدم
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

// دالة معالجة التسجيل
export default async function handler(req, res) {
  console.log("📥 استلام الطلب في /register");

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { username, password } = req.body;

  // التحقق من صحة البيانات المدخلة
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

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء مستخدم جديد مع كلمة المرور المشفرة
    const newUser = new User({ username, password: hashedPassword });
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
}
