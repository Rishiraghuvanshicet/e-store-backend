const express = require("express");
const router = express.Router();

const {
  getProducts,
  postProduct,
  createProduct,
  getProductById,
} = require("../controllers/productController");
const multer = require("multer");
const path = require("path");

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads")); // saves to /uploads
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9_-]/gi, "_");
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage: uploadStorage });

router.get("/getProduct", getProducts);
router.get("/:id", getProductById);
// removed bulk seeding endpoint to avoid misuse
// router.post("/postProduct", postProduct);
router.post("/create", upload.single("image"), createProduct);

module.exports = router;
