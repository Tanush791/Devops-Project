const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set up disk storage for uploaded local files
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'prod-' + Date.now() + '-' + Math.round(Math.random() * 1e6) + ext);
  }
});
const upload = multer({ storage });

const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

function loadJSON(file, fallback) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error("Error reading " + file, e);
  }
  return fallback;
}

function saveJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error("Error writing " + file, e);
  }
}

let products = loadJSON(PRODUCTS_FILE, [
  { 
    id: 1, 
    name: "NVMe Edge Server Node", 
    category: "Compute", 
    price: 74999, 
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80",
    desc: "16-core ARM CPU, 64GB ECC RAM, dual 2.5G NICs designed for Kubernetes worker nodes." 
  }
]);

let orders = loadJSON(ORDERS_FILE, []);

// GET products
app.get('/api/products', (req, res) => res.json(products));

// POST new product
app.post('/api/products', upload.single('imageFile'), (req, res) => {
  const { name, category, price, desc, imageUrl } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Name and Price are required." });

  const defaultImg = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80";
  let finalImage = defaultImg;
  
  if (req.file) {
    finalImage = '/uploads/' + req.file.filename;
  } else if (imageUrl && imageUrl.trim() !== '') {
    finalImage = imageUrl.trim();
  }

  const newProduct = {
    id: Date.now(),
    name, category: category || "Compute", price: Number(price),
    image: finalImage, desc: desc || "High-performance enterprise hardware."
  };

  products.push(newProduct);
  saveJSON(PRODUCTS_FILE, products);
  res.status(201).json({ message: "Product listed successfully", product: newProduct });
});

// PUT update existing product
app.put('/api/products/:id', upload.single('imageFile'), (req, res) => {
  const productId = Number(req.params.id);
  const targetIndex = products.findIndex(p => p.id === productId);
  
  if (targetIndex === -1) return res.status(404).json({ error: "Product not found" });

  const { name, category, price, desc, imageUrl } = req.body;
  let finalImage = products[targetIndex].image; // Keep existing by default

  // Update image if a new one is provided
  if (req.file) {
    // Delete old file if it was a local upload to save space
    if (finalImage.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, 'public', finalImage);
      if (fs.existsSync(oldPath)) { try { fs.unlinkSync(oldPath); } catch (err) {} }
    }
    finalImage = '/uploads/' + req.file.filename;
  } else if (imageUrl && imageUrl.trim() !== '') {
    finalImage = imageUrl.trim();
  }

  // Update properties
  products[targetIndex] = {
    ...products[targetIndex],
    name: name || products[targetIndex].name,
    category: category || products[targetIndex].category,
    price: price ? Number(price) : products[targetIndex].price,
    desc: desc || products[targetIndex].desc,
    image: finalImage
  };

  saveJSON(PRODUCTS_FILE, products);
  res.json({ message: "Product updated successfully" });
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
  const productId = Number(req.params.id);
  const target = products.find(p => p.id === productId);
  if (!target) return res.status(404).json({ error: "Product not found" });

  if (target.image && target.image.startsWith('/uploads/')) {
    const localFilePath = path.join(__dirname, 'public', target.image);
    if (fs.existsSync(localFilePath)) {
      try { fs.unlinkSync(localFilePath); } catch (err) { }
    }
  }

  products = products.filter(p => p.id !== productId);
  saveJSON(PRODUCTS_FILE, products);
  res.json({ message: "Product unlisted successfully" });
});

// GET orders
app.get('/api/orders', (req, res) => res.json(orders));

// POST checkout
app.post('/api/checkout', (req, res) => {
  const { items, buyerName, total } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: "Cart is empty" });

  const orderRecord = {
    id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
    buyer: buyerName || "Guest Checkout",
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    total: total || items.reduce((s, i) => s + (i.price * i.qty), 0),
    items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price }))
  };

  orders.unshift(orderRecord);
  saveJSON(ORDERS_FILE, orders);
  res.json({ message: "Order processed successfully!", orderId: orderRecord.id });
});

app.listen(PORT, () => console.log("Server running on port " + PORT));
