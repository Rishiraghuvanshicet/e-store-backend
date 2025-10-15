
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { register, login, logout } = require("../controllers/authController");
const User = require("../models/User");
const Message = require("../models/Message");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Add friend by email
router.post("/friends/add", auth, async (req, res) => {
  try {
    const { email } = req.body;
    const me = await User.findById(req.user.id);
    const other = await User.findOne({ email });
    if (!other) return res.status(404).json({ message: "User not found" });
    if (String(other._id) === String(me._id)) return res.status(400).json({ message: "Cannot add yourself" });
    if (!me.friends.includes(other._id)) {
      me.friends.push(other._id);
      await me.save();
    }
    res.json({ message: "Friend added", friendId: other._id });
  } catch (e) {
    res.status(500).json({ message: "Error adding friend" });
  }
});

// List friends
router.get("/friends", auth, async (req, res) => {
  const me = await User.findById(req.user.id).populate("friends", "name email");
  res.json(me.friends || []);
});

// Remove friend by id
router.delete("/friends/:friendId", auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const me = await User.findById(req.user.id);
    me.friends = me.friends.filter((f) => String(f) !== String(friendId));
    await me.save();
    res.json({ message: "Friend removed" });
  } catch (e) {
    res.status(500).json({ message: "Error removing friend" });
  }
});

module.exports = router;
