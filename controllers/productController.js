const Product = require("../models/Product");
const path = require("path");

exports.getProducts = async (req, res) => {
  try {
    const { category, material, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (material) filter.material = material;
    if (search) filter.name = { $regex: search, $options: "i" };

    const products = await Product.find(filter);
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ message: "Error fetching products" });
  }
};

exports.postProduct = async (req, res) => {
  const products = req.body;
  if (!Array.isArray(products)) {
    return res.status(400).json({ message: "Send an array of products" });
  }
  await Product.deleteMany();
  const insertedProducts = await Product.insertMany(products);
  res.status(201).json({
    message: `${insertedProducts.length} products inserted successfully!`,
    data: insertedProducts,
  });
};
// Single product create via multipart/form-data with image upload
exports.createProduct = async (req, res) => {
  try {
    const { name, category, material, price, description } = req.body;
    if (!name || !category || !material || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let imageUrl = req.body.image || "";
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const relativePath = path.posix.join("uploads", req.file.filename);
      imageUrl = `${baseUrl}/${relativePath}`;
    }

    const created = await Product.create({
      name,
      category,
      material,
      price,
      description,
      image: imageUrl,
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({ message: "Error creating product" });
  }
};

// Get single product by id
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch (error) {
    return res.status(404).json({ message: "Product not found" });
  }
};