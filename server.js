const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoute = require("./routes/auth");
const productRoutes = require("./routes/product");
const messageRoutes = require("./routes/message");
const Message = require("./models/Message");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://e-shop-woad-one.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Serve static assets (images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

// Simple in-memory map of userId -> socketId
const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("register", (userId) => {
    if (userId) onlineUsers.set(userId, socket.id);
  });

  socket.on("send_message", ({ toUserId, message, product, fromUserId }) => {
    const normalizedProduct = product
      ? {
          _id: product._id || undefined,
          name: product.name,
          image: product.image,
          price: product.price,
        }
      : null;
    Message.create({
      fromUser: fromUserId,
      toUser: toUserId,
      text: message || "",
      product: normalizedProduct,
    })
      .then((saved) => {
        const toSocket = onlineUsers.get(toUserId);
        const payload = {
          fromUserId,
          message: saved.text,
          product: saved.product,
          timestamp: new Date(saved.createdAt).getTime(),
        };
        if (toSocket) io.to(toSocket).emit("receive_message", payload);
        const fromSocket = onlineUsers.get(fromUserId);
        if (fromSocket) io.to(fromSocket).emit("message_saved", payload);
      })
      .catch(() => {
        // silently fail for now
      });
  });

  // Multi-recipient: toUserIds array
  socket.on(
    "send_message_multi",
    ({ toUserIds, message, product, fromUserId }) => {
      const normalizedProduct = product
        ? {
            _id: product._id || undefined,
            name: product.name,
            image: product.image,
            price: product.price,
          }
        : null;
      if (!Array.isArray(toUserIds) || !toUserIds.length) return;
      Promise.all(
        toUserIds.map((toUserId) =>
          Message.create({
            fromUser: fromUserId,
            toUser: toUserId,
            text: message || "",
            product: normalizedProduct,
          }).then((saved) => {
            const toSocket = onlineUsers.get(toUserId);
            const payload = {
              fromUserId,
              message: saved.text,
              product: saved.product,
              timestamp: new Date(saved.createdAt).getTime(),
            };
            if (toSocket) io.to(toSocket).emit("receive_message", payload);
            return true;
          })
        )
      ).catch(() => {});
      const fromSocket = onlineUsers.get(fromUserId);
      if (fromSocket)
        io.to(fromSocket).emit("message_saved", {
          fromUserId,
          message,
          product: normalizedProduct,
          timestamp: Date.now(),
        });
    }
  );

  socket.on("disconnect", () => {
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) onlineUsers.delete(uid);
    }
  });
});

connectDB();

app.use("/api/auth", userRoute);
app.use("/api/products", productRoutes);
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
