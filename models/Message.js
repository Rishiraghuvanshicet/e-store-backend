const mongoose = require("mongoose");

const ProductSnapshotSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, required: false },
    name: String,
    image: String,
    price: Number,
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "" },
    product: { type: ProductSnapshotSchema, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);


