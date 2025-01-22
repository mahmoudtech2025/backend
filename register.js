const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("✅ تم الاتصال بقاعدة البيانات"))
  .catch(err => console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err));

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "يرجى إدخال اسم المستخدم وكلمة المرور",
        });
    }

    try {
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
