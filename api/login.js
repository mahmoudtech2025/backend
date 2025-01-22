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

// دالة تسجيل الدخول
export default async function handler(req, res) {
  console.log("📥 استلام طلب تسجيل الدخول في /login");

  // التحقق من أن الطريقة هي POST
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
    // البحث عن المستخدم في قاعدة البيانات
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "اسم المستخدم غير موجود",
      });
    }

    // التحقق من صحة كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "كلمة المرور غير صحيحة",
      });
    }

    // تسجيل الدخول بنجاح
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
}
