import mongoose from "mongoose";

// تضمين MONGO_URI مباشرة في الكود
const MONGO_URI = "mongodb+srv://mahmoudtech2025:mahmoud2025mahmoud@cluster0.9ghor.mongodb.net/?retryWrites=true&w=majority";

// الاتصال بقاعدة البيانات
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ تم الاتصال بقاعدة البيانات"))
  .catch(err => console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err));

// تعريف نموذج المستخدم
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

// معالجة الطلبات
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

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
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء التسجيل",
    });
  }
}
