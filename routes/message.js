const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Message = require("../models/Message");

// Get conversation between current user and peer
router.get("/:peerId", auth, async (req, res) => {
  try {
    const me = req.user.id;
    const { peerId } = req.params;
    const messages = await Message.find({
      $or: [
        { fromUser: me, toUser: peerId },
        { fromUser: peerId, toUser: me },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();
    res.json(messages);
  } catch (e) {
    res.status(500).json({ message: "Failed to load messages" });
  }
});

module.exports = router;


