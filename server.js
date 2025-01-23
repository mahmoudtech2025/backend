const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to Database"))
  .catch((err) => console.log("❌ Database Connection Error: ", err));

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
});

const User = mongoose.model("User", UserSchema);

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: "All fields are required." });

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ success: false, message: "Username already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ success: true, message: "Account created successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: "All fields are required." });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ success: false, message: "Invalid credentials." });

    res.status(200).json({ success: true, balance: user.balance, message: "Login successful." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post("/deposit", async (req, res) => {
  const { username, depositAmount } = req.body;
  if (!username || !depositAmount) return res.status(400).json({ success: false, message: "All fields are required." });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    user.balance += depositAmount;
    await user.save();

    res.status(200).json({ success: true, balance: user.balance, message: "Deposit successful." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.listen(process.env.PORT || 5000, () => console.log("🚀 Server is running..."));
