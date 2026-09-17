const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

const INITIAL_10_PRODUCTS = [
  { id: 101, name: "NVMe Edge Server Node", category: "Compute", price: 74999, image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80", desc: "16-core ARM CPU, 64GB ECC RAM, dual 2.5G NICs designed for Kubernetes worker nodes." },
  { id: 102, name: "Neural Processing Unit v4", category: "Compute", price: 145000, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80", desc: "Next-gen AI inference accelerator delivering 250 TFLOPs for machine learning workloads at the edge." },
  { id: 103, name: "100GbE Top-of-Rack Switch", category: "Network", price: 215000, image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80", desc: "32-port 100 Gigabit Ethernet switch with ultra-low latency for high-density datacenter clusters." },
  { id: 104, name: "32TB Enterprise U.2 NVMe SSD", category: "Storage", price: 85000, image: "https://images.unsplash.com/photo-1628527304948-06157ee3c8a6?w=600&auto=format&fit=crop&q=80", desc: "PCIe Gen 4.0 data center solid state drive providing up to 7000MB/s sequential read speeds." },
  { id: 105, name: "Hardware Security Module (HSM)", category: "Security", price: 195000, image: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=600&auto=format&fit=crop&q=80", desc: "FIPS 140-2 Level 3 certified appliance for secure cryptographic key generation and storage." },
  { id: 106, name: "64-Core Threadripper Workstation", category: "Compute", price: 380000, image: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&auto=format&fit=crop&q=80", desc: "Uncompromising compute power with 256MB L3 Cache and 128 PCIe 4.0 lanes for virtualization." },
  { id: 107, name: "Edge Router SD-WAN Gateway", category: "Network", price: 45000, image: "https://images.unsplash.com/photo-1506399558188-acca6f8cbf41?w=600&auto=format&fit=crop&q=80", desc: "Cloud-managed secure branch routing with automated failover and deep packet inspection." },
  { id: 108, name: "4U High-Density Storage JBOD", category: "Storage", price: 120000, image: "https://images.unsplash.com/photo-1524439188326-e47322d1cef2?w=600&auto=format&fit=crop&q=80", desc: "Scalable 60-bay storage chassis supporting up to 1.2 Petabytes of raw storage capacity." },
  { id: 109, name: "Zero-Trust Biometric Access Key", category: "Security", price: 6500, image: "https://images.unsplash.com/photo-1642425149599-ca1128c66e2c?w=600&auto=format&fit=crop&q=80", desc: "FIDO2 compliant hardware authenticator with integrated fingerprint sensor for passwordless auth." },
  { id: 110, name: "SFP28 25G Fiber Transceiver", category: "Network", price: 12500, image: "https://images.unsplash.com/photo-1541884848529-6887eb215b28?w=600&auto=format&fit=crop&q=80", desc: "Hot-swappable 25-Gigabit Ethernet optical transceiver for multi-mode fiber connections." }
];

function getProducts() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}
  saveJSON(PRODUCTS_FILE, INITIAL_10_PRODUCTS);
  return INITIAL_10_PRODUCTS;
}

function saveJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

function getOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch (e) {}
  return [];
}

// GET all products
app.get('/api/products', (req, res) => res.json(getProducts()));

// POST new product
app.post('/api/products', upload.single('imageFile'), (req, res) => {
  const { name, category, price, desc, imageUrl } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Name and Price required" });

  let finalImage = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80";
  if (req.file) finalImage = '/uploads/' + req.file.filename;
  else if (imageUrl && imageUrl.trim() !== '') finalImage = imageUrl.trim();

  const currentProducts = getProducts();
  const newProduct = {
    id: Date.now(),
    name, category: category || "Compute", price: Number(price),
    image: finalImage, desc: desc || "High-performance hardware."
  };

  currentProducts.push(newProduct);
  saveJSON(PRODUCTS_FILE, currentProducts);
  res.status(201).json({ message: "Product listed", product: newProduct });
});

// PUT update product
app.put('/api/products/:id', upload.single('imageFile'), (req, res) => {
  const productId = Number(req.params.id);
  const currentProducts = getProducts();
  const targetIndex = currentProducts.findIndex(p => p.id === productId);
  if (targetIndex === -1) return res.status(404).json({ error: "Not found" });

  const { name, category, price, desc, imageUrl } = req.body;
  let finalImage = currentProducts[targetIndex].image;

  if (req.file) {
    if (finalImage.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, 'public', finalImage);
      if (fs.existsSync(oldPath)) { try { fs.unlinkSync(oldPath); } catch (err) {} }
    }
    finalImage = '/uploads/' + req.file.filename;
  } else if (imageUrl && imageUrl.trim() !== '') {
    finalImage = imageUrl.trim();
  }

  currentProducts[targetIndex] = {
    ...currentProducts[targetIndex],
    name: name || currentProducts[targetIndex].name,
    category: category || currentProducts[targetIndex].category,
    price: price ? Number(price) : currentProducts[targetIndex].price,
    desc: desc || currentProducts[targetIndex].desc,
    image: finalImage
  };

  saveJSON(PRODUCTS_FILE, currentProducts);
  res.json({ message: "Updated" });
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
  const productId = Number(req.params.id);
  let currentProducts = getProducts();
  const target = currentProducts.find(p => p.id === productId);
  if (!target) return res.status(404).json({ error: "Not found" });

  if (target.image && target.image.startsWith('/uploads/')) {
    const localFilePath = path.join(__dirname, 'public', target.image);
    if (fs.existsSync(localFilePath)) { try { fs.unlinkSync(localFilePath); } catch (err) {} }
  }

  currentProducts = currentProducts.filter(p => p.id !== productId);
  saveJSON(PRODUCTS_FILE, currentProducts);
  res.json({ message: "Deleted" });
});

// GET all orders
app.get('/api/orders', (req, res) => res.json(getOrders()));

// GET single order by ID (bulletproof type-safe lookup)
app.get('/api/orders/:id', (req, res) => {
  const targetId = String(req.params.id || '').trim().toLowerCase();
  const orders = getOrders();
  const found = orders.find(o => String(o.id || '').trim().toLowerCase() === targetId);

  if (!found) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(found);
});

// POST checkout
app.post('/api/checkout', (req, res) => {
  const { items, buyerName, buyerEmail, buyerAddress, paymentMethod, total } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: "Cart is empty" });

  const orders = getOrders();
  const orderRecord = {
    id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
    buyer: buyerName || "Guest Buyer",
    email: buyerEmail || "Not provided",
    address: buyerAddress || "Standard Ground Delivery",
    paymentMethod: paymentMethod || "Razorpay / UPI",
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    total: total || items.reduce((s, i) => s + (i.price * i.qty), 0),
    items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price }))
  };

  orders.unshift(orderRecord);
  saveJSON(ORDERS_FILE, orders);
  res.json({ message: "Order processed successfully!", orderId: orderRecord.id });
});

app.listen(PORT, () => console.log("Server running on port " + PORT));
